"""
grok.py — xAI Grok API Provider (Free Tier Compliant)

Implements BaseAIProvider using the AsyncOpenAI SDK configured for xAI endpoints (https://api.x.ai/v1).

Design rules:
  - Business logic never calls this directly — only through the AI Orchestrator.
  - The ADSA resolver selects this provider when GROK_API_KEY is configured and is_available() returns True.
  - If Grok is unavailable or rate-limited, the resolver falls back to MockAIProvider without changing service logic.

Error Handling & Rate Limit Strategy:
  - Free Tier Rate Limits: Retries up to 3 attempts with exponential backoff (1s -> 2s -> 4s).
  - Timeout: 15 seconds enforced per call via asyncio.wait_for.
  - Failures: Raises AIProviderError — caught by resolver for automatic fallback to MockAIProvider.
"""

import asyncio
import logging
from typing import List
from app.modules.ai.providers.base import BaseAIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_GROK_MODEL = "grok-2-latest"
_MAX_RETRIES = 3
_TIMEOUT_SECONDS = 15.0
_BACKOFF_BASE = 1.0


class AIProviderError(Exception):
    """Raised when the AI provider fails after all retries."""


class GrokAIProvider(BaseAIProvider):
    """
    xAI Grok API Provider for EduPulse.
    Uses AsyncOpenAI client pointed at xAI's OpenAI-compatible base URL.
    """

    def __init__(self):
        self._api_key: str = ""
        self._model_name: str = _DEFAULT_GROK_MODEL
        self._base_url: str = "https://api.x.ai/v1"
        self._init_client()

    def _init_client(self) -> None:
        """
        Validate Grok API configuration settings.
        Failures are non-fatal — is_available() will return False.
        """
        try:
            api_key = settings.GROK_API_KEY
            if not api_key:
                logger.warning("GrokAIProvider: GROK_API_KEY not set. Provider unavailable.")
                return

            self._api_key = api_key
            self._model_name = settings.GROK_MODEL or _DEFAULT_GROK_MODEL
            self._base_url = settings.GROK_BASE_URL or "https://api.x.ai/v1"
            logger.info("GrokAIProvider: Initialized with model '%s' at '%s'.", self._model_name, self._base_url)
        except Exception as exc:
            logger.error("GrokAIProvider: Initialization error — %s", exc)

    def provider_name(self) -> str:
        return "grok"

    def is_available(self) -> bool:
        """
        True when GROK_API_KEY is configured.
        """
        return bool(self._api_key)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        **kwargs,
    ) -> str:
        """
        Generate a text response from Grok API with retry and timeout protections.
        """
        if not self.is_available():
            raise AIProviderError("GrokAIProvider is not available (GROK_API_KEY not set).")

        last_exc: Exception = RuntimeError("No attempts made.")

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                text = await asyncio.wait_for(
                    self._async_call_grok_chat(prompt, system_instruction),
                    timeout=_TIMEOUT_SECONDS,
                )
                logger.info("GrokAIProvider: Response generated on attempt %d.", attempt)
                return text

            except asyncio.TimeoutError as exc:
                last_exc = exc
                logger.warning("GrokAIProvider: Timeout on attempt %d/%d.", attempt, _MAX_RETRIES)
            except Exception as exc:
                last_exc = exc
                logger.warning("GrokAIProvider: Error on attempt %d/%d — %s", attempt, _MAX_RETRIES, exc)

            if attempt < _MAX_RETRIES:
                backoff = _BACKOFF_BASE * (2 ** (attempt - 1))
                logger.info("GrokAIProvider: Backing off %.1fs before retry.", backoff)
                await asyncio.sleep(backoff)

        raise AIProviderError(f"GrokAIProvider: All {_MAX_RETRIES} attempts failed. Last error: {last_exc}")

    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate vector embedding for text.
        Returns a 768-dim zero-filled fallback vector if embedding service is inactive.
        """
        if not self.is_available():
            raise AIProviderError("GrokAIProvider is not available.")

        try:
            # If xAI supports embeddings endpoint:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self._api_key, base_url=self._base_url)
            response = await client.embeddings.create(
                model="v1",
                input=text
            )
            return response.data[0].embedding
        except Exception as exc:
            logger.warning("GrokAIProvider: Embedding call fallback to zero-vector — %s", exc)
            return [0.0] * 768

    async def _async_call_grok_chat(self, prompt: str, system_instruction: str) -> str:
        """Execute chat completion request using AsyncOpenAI xAI client."""
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=self._api_key, base_url=self._base_url)
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
