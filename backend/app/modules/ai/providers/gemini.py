"""
gemini.py — Google Gemini AI Provider

Implements BaseAIProvider using the modern google-genai SDK (v1+).

Design rules (from 09_Coding_Guidelines.md & 04_System_Architecture.md):
  - Business logic never calls this directly — only through the AI Orchestrator.
  - The resolver selects this provider only when GEMINI_API_KEY is configured
    and is_available() returns True.
  - If Gemini is unavailable, the resolver falls back to MockProvider
    without any change to service logic (ADSA principle).

Error Handling Strategy (from AI_Implementation_Master_Plan.md):
  - Retries:  Up to 3 attempts with exponential backoff (1s → 2s → 4s).
  - Timeout:  15 seconds enforced per call via asyncio.wait_for.
  - Failure:  Raises AIProviderError — caught by the resolver for automatic
              fallback to MockAIProvider.

Models used (free tier):
  - Text generation: gemini-1.5-flash   (high quota, low latency)
  - Embeddings:      text-embedding-004 (768-dim, free tier)
"""

import asyncio
import logging
from app.modules.ai.providers.base import BaseAIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
_GEMINI_TEXT_MODEL  = "gemini-1.5-flash"
_GEMINI_EMBED_MODEL = "text-embedding-004"
_MAX_RETRIES        = 3
_TIMEOUT_SECONDS    = 15.0
_BACKOFF_BASE       = 1.0   # seconds; doubles each retry: 1 → 2 → 4


class AIProviderError(Exception):
    """Raised when the AI provider fails after all retries."""


class GeminiAIProvider(BaseAIProvider):
    """
    Google Gemini AI Provider for EduPulse using the google-genai SDK.

    Wraps the synchronous google-genai SDK in async-friendly helpers that run
    blocking SDK calls inside asyncio's default thread-pool executor so the
    FastAPI event loop is never blocked.

    Configuration:
        Reads GEMINI_API_KEY from app.core.config.settings.
        If the key is empty, is_available() returns False and the resolver
        automatically falls back to MockAIProvider.
    """

    def __init__(self):
        self._api_key: str = ""
        self._sdk_available: bool = False
        self._init_client()

    def _init_client(self) -> None:
        """
        Validate the API key and confirm the SDK is importable.
        Failures here are non-fatal — is_available() will return False.
        """
        try:
            import google.genai  # noqa: F401 — confirms SDK is installed
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                logger.warning("GeminiProvider: GEMINI_API_KEY not set. Provider unavailable.")
                return
            self._api_key = api_key
            self._sdk_available = True
            logger.info("GeminiProvider: Initialised with model '%s'.", _GEMINI_TEXT_MODEL)
        except ImportError:
            logger.warning(
                "GeminiProvider: google-genai package not installed. "
                "Install it with: pip install google-genai"
            )
        except Exception as exc:
            logger.error("GeminiProvider: Initialisation error — %s", exc)

    # ------------------------------------------------------------------
    # BaseAIProvider interface
    # ------------------------------------------------------------------

    def provider_name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        """
        True only when the SDK is installed AND GEMINI_API_KEY is set.
        The resolver uses this to decide between Gemini and MockProvider.
        """
        return self._sdk_available and bool(self._api_key)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        **kwargs,
    ) -> str:
        """
        Generate a text response from Gemini with retry + timeout.

        Args:
            prompt:             User-facing content prompt.
            system_instruction: Optional system persona / safety instruction.
            **kwargs:           Provider-specific params (never reach service layer).

        Returns:
            Plain text response from Gemini.

        Raises:
            AIProviderError: If all retry attempts fail or provider is unavailable.
        """
        if not self.is_available():
            raise AIProviderError(
                "GeminiProvider is not available (API key not configured)."
            )

        last_exc: Exception = RuntimeError("No attempts made.")

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                text = await asyncio.wait_for(
                    self._async_generate_text(prompt, system_instruction),
                    timeout=_TIMEOUT_SECONDS,
                )
                logger.info("GeminiProvider: Response generated on attempt %d.", attempt)
                return text

            except asyncio.TimeoutError as exc:
                last_exc = exc
                logger.warning(
                    "GeminiProvider: Timeout on attempt %d/%d.", attempt, _MAX_RETRIES
                )
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "GeminiProvider: Error on attempt %d/%d — %s", attempt, _MAX_RETRIES, exc
                )

            if attempt < _MAX_RETRIES:
                backoff = _BACKOFF_BASE * (2 ** (attempt - 1))
                logger.info("GeminiProvider: Backing off %.1fs before retry.", backoff)
                await asyncio.sleep(backoff)

        raise AIProviderError(
            f"GeminiProvider: All {_MAX_RETRIES} attempts failed. Last error: {last_exc}"
        )

    async def generate_embedding(self, text: str) -> list[float]:
        """
        Generate a 768-dim embedding via Gemini text-embedding-004.

        Args:
            text: Plain text to embed.

        Returns:
            List of 768 floats.

        Raises:
            AIProviderError: If embedding generation fails after all retries.
        """
        if not self.is_available():
            raise AIProviderError(
                "GeminiProvider is not available (API key not configured)."
            )

        last_exc: Exception = RuntimeError("No attempts made.")

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                embedding = await asyncio.wait_for(
                    self._async_generate_embedding(text),
                    timeout=_TIMEOUT_SECONDS,
                )
                logger.info(
                    "GeminiProvider: Embedding generated (%d dims) on attempt %d.",
                    len(embedding), attempt,
                )
                return embedding

            except asyncio.TimeoutError as exc:
                last_exc = exc
                logger.warning(
                    "GeminiProvider: Embedding timeout on attempt %d/%d.", attempt, _MAX_RETRIES
                )
            except Exception as exc:
                last_exc = exc
                logger.warning(
                    "GeminiProvider: Embedding error on attempt %d/%d — %s",
                    attempt, _MAX_RETRIES, exc,
                )

            if attempt < _MAX_RETRIES:
                backoff = _BACKOFF_BASE * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)

        raise AIProviderError(
            f"GeminiProvider: Embedding failed after {_MAX_RETRIES} attempts. "
            f"Last error: {last_exc}"
        )

    # ------------------------------------------------------------------
    # Internal helpers — run synchronous SDK calls in thread-pool
    # ------------------------------------------------------------------

    async def _async_generate_text(self, prompt: str, system_instruction: str) -> str:
        """Offload blocking SDK call to thread-pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._sync_generate_text, prompt, system_instruction
        )

    def _sync_generate_text(self, prompt: str, system_instruction: str) -> str:
        """Synchronous Gemini text generation (runs inside thread-pool)."""
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=self._api_key)

        config = types.GenerateContentConfig(
            temperature=0.4,
            max_output_tokens=1024,
            top_p=0.9,
            system_instruction=system_instruction or None,
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_ONLY_HIGH",
                ),
            ],
        )

        response = client.models.generate_content(
            model=_GEMINI_TEXT_MODEL,
            contents=prompt,
            config=config,
        )
        return response.text

    async def _async_generate_embedding(self, text: str) -> list[float]:
        """Offload blocking embedding call to thread-pool executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self._sync_generate_embedding, text
        )

    def _sync_generate_embedding(self, text: str) -> list[float]:
        """Synchronous Gemini embedding generation (runs inside thread-pool)."""
        from google import genai

        client = genai.Client(api_key=self._api_key)
        result = client.models.embed_content(
            model=_GEMINI_EMBED_MODEL,
            contents=text,
        )
        return result.embeddings[0].values
