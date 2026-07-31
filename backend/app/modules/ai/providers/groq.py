"""
groq.py — Groq Cloud AI Provider (LLaMA 3.3 70B & Ultra-Fast Free Tier Models)

Implements BaseAIProvider using the AsyncOpenAI SDK configured for Groq Cloud API endpoints (https://api.groq.com/openai/v1).

Design rules:
  - Business logic never calls this directly — only through the AI Orchestrator.
  - The ADSA resolver selects this provider when GROQ_API or GROQ_API_KEY is configured and is_available() returns True.
  - If Groq is unavailable, the resolver falls back to MockAIProvider without changing service logic.

Models supported (Free Tier):
  - llama-3.3-70b-versatile (default, high intelligence)
  - llama-3.1-8b-instant (low latency)
  - mixtral-8x7b-32768
"""

import asyncio
import logging
from typing import List
from app.modules.ai.providers.base import BaseAIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
_MAX_RETRIES = 3
_TIMEOUT_SECONDS = 15.0
_BACKOFF_BASE = 1.0


class AIProviderError(Exception):
    """Raised when the AI provider fails after all retries."""


class GroqAIProvider(BaseAIProvider):
    """
    Groq Cloud API Provider for EduPulse.
    Uses AsyncOpenAI client pointed at Groq's OpenAI-compatible base URL (https://api.groq.com/openai/v1).
    """

    def __init__(self):
        self._api_key: str = ""
        self._model_name: str = _DEFAULT_GROQ_MODEL
        self._base_url: str = _GROQ_BASE_URL
        self._init_client()

    def _init_client(self) -> None:
        """
        Validate Groq API key configuration. Checks settings.GROQ_API_KEY or settings.GROQ_API.
        Failures are non-fatal — is_available() will return False.
        """
        try:
            api_key = settings.GROQ_API_KEY or settings.GROQ_API
            if not api_key:
                logger.warning("GroqAIProvider: GROQ_API / GROQ_API_KEY not set. Provider unavailable.")
                return

            self._api_key = api_key
            self._model_name = settings.GROQ_MODEL or _DEFAULT_GROQ_MODEL
            self._base_url = settings.GROQ_BASE_URL or _GROQ_BASE_URL
            logger.info("GroqAIProvider: Initialized with model '%s' at '%s'.", self._model_name, self._base_url)
        except Exception as exc:
            logger.error("GroqAIProvider: Initialization error — %s", exc)

    def provider_name(self) -> str:
        return "groq"

    def is_available(self) -> bool:
        """
        True when GROQ_API_KEY or GROQ_API is configured.
        """
        api_key = self._api_key or settings.GROQ_API_KEY or settings.GROQ_API
        return bool(api_key)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        **kwargs,
    ) -> str:
        """
        Generate a text response from Groq API with retry and timeout protections.
        """
        if not self.is_available():
            raise AIProviderError("GroqAIProvider is not available (GROQ_API_KEY not set).")

        last_exc: Exception = RuntimeError("No attempts made.")

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                text = await asyncio.wait_for(
                    self._async_call_groq_chat(prompt, system_instruction),
                    timeout=_TIMEOUT_SECONDS,
                )
                logger.info("GroqAIProvider: Response generated on attempt %d.", attempt)
                return text

            except asyncio.TimeoutError as exc:
                last_exc = exc
                logger.warning("GroqAIProvider: Timeout on attempt %d/%d.", attempt, _MAX_RETRIES)
            except Exception as exc:
                last_exc = exc
                logger.warning("GroqAIProvider: Error on attempt %d/%d — %s", attempt, _MAX_RETRIES, exc)

            if attempt < _MAX_RETRIES:
                backoff = _BACKOFF_BASE * (2 ** (attempt - 1))
                logger.info("GroqAIProvider: Backing off %.1fs before retry.", backoff)
                await asyncio.sleep(backoff)

        raise AIProviderError(f"GroqAIProvider: All {_MAX_RETRIES} attempts failed. Last error: {last_exc}")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate vector embedding for text.
        Returns a 768-dim zero-filled fallback vector.
        """
        return [0.0] * 768

    async def _async_call_groq_chat(self, prompt: str, system_instruction: str) -> str:
        """Execute chat completion request using AsyncOpenAI Groq client."""
        from openai import AsyncOpenAI

        api_key = self._api_key or settings.GROQ_API_KEY or settings.GROQ_API
        client = AsyncOpenAI(api_key=api_key, base_url=self._base_url)
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model=self._model_name,
            messages=messages,
            temperature=0.4,
            max_tokens=1024,
        )
        return response.choices[0].message.content or ""
