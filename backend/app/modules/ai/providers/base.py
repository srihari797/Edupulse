"""
base.py — Abstract AI Provider

Defines the ADSA-compliant provider interface that every AI implementation
(MockProvider, GeminiProvider, future OpenAI/Azure providers) must satisfy.

Business logic in the AI Service layer must never depend on a specific provider
implementation — only on this interface.

Architecture Rule (from 09_Coding_Guidelines.md):
    - AI only through AI Orchestrator.
    - Do not call Gemini directly from modules.
    - Return structured responses only.
"""
from abc import ABC, abstractmethod


class BaseAIProvider(ABC):
    """
    Abstract base class for all EduPulse AI Providers.

    All AI provider implementations — Mock, Gemini, and future providers —
    must implement every method defined here.

    This interface is the ADSA boundary for the AI layer.
    The AI Service layer depends ONLY on this class, never on a concrete provider.
    """

    # -----------------------------------------------------------------
    # Core Generation
    # -----------------------------------------------------------------

    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: str = "",
        **kwargs,
    ) -> str:
        """
        Generate a text response from the AI model.

        Args:
            prompt:             The user-facing content prompt sent to the model.
            system_instruction: Optional system-level instruction that shapes model
                                behaviour (safety, persona, output format).
            **kwargs:           Additional provider-specific parameters (temperature,
                                max_tokens, etc.) that must NOT leak into service logic.

        Returns:
            A plain text response string from the AI model.

        Raises:
            AIProviderError: If the provider call fails after all retries.
        """
        ...

    # -----------------------------------------------------------------
    # Embedding Generation (Vector Search)
    # -----------------------------------------------------------------

    @abstractmethod
    async def generate_embedding(self, text: str) -> list[float]:
        """
        Generate a vector embedding for the supplied text.

        Used by the Qdrant integration to store and retrieve semantically
        similar observations, notes, and student data chunks.

        Args:
            text: The plain text to embed.

        Returns:
            A list of floats representing the text's vector embedding.

        Raises:
            AIProviderError: If embedding generation fails.
        """
        ...

    # -----------------------------------------------------------------
    # Provider Identity
    # -----------------------------------------------------------------

    @abstractmethod
    def provider_name(self) -> str:
        """
        Returns a human-readable identifier for this provider.

        Used for logging, diagnostics, and usage tracking.

        Returns:
            A string such as "gemini", "mock", or "openai".
        """
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """
        Returns True if this provider is properly configured and reachable.

        Used by the resolver to determine whether to fall back to MockProvider
        when the real provider is unavailable or its API key is missing.

        Returns:
            bool — True if provider can be used, False otherwise.
        """
        ...
