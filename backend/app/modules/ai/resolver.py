"""
resolver.py — AI Provider Resolver (ADSA Switcher)

Selects the correct AI provider at runtime using the same ADSA pattern
established across every other EduPulse module.

ADSA Resolution Logic:
  - DATA_SOURCE == "real"   → GroqAIProvider (if GROQ_API or GROQ_API_KEY configured)
  - DATA_SOURCE == "mock"   → MockAIProvider (always)
  - DATA_SOURCE == "hybrid" → GroqAIProvider if available, else MockAIProvider
  - GroqAIProvider.is_available() == False (key missing/SDK absent)
                            → Automatic fallback to MockAIProvider

Architecture rule (from 09_Coding_Guidelines.md):
  - Business logic never depends on the provider implementation.
  - All AI requests pass through this resolver.
  - The AI Service layer receives only a BaseAIProvider instance.

Module-scoped singletons:
  Providers are instantiated once at module load and reused across all requests.
  This avoids redundant re-initialisation and keeps connection state stable.
"""

import logging
from app.core.config import settings
from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.providers.mock import MockAIProvider
from app.modules.ai.providers.groq import GroqAIProvider
from app.modules.ai.repository import AIRepository, MockAIRepository, RealAIRepository

logger = logging.getLogger(__name__)

# Single shared instance for in-memory mock statefulness across requests
_mock_repository_instance = MockAIRepository()

# ---------------------------------------------------------------------------
# Module-scoped singletons — instantiated once at startup
# ---------------------------------------------------------------------------

_mock_provider = MockAIProvider()
_groq_provider = GroqAIProvider()


# ---------------------------------------------------------------------------
# Public resolver
# ---------------------------------------------------------------------------

def get_ai_provider() -> BaseAIProvider:
    """
    ADSA AI Provider Resolver.

    Returns the correct BaseAIProvider implementation based on:
      1. settings.DATA_SOURCE (mock / real / hybrid)
      2. Whether GroqAIProvider.is_available() returns True

    Used as a FastAPI dependency via Depends(get_ai_provider).

    Returns:
        A fully-initialised BaseAIProvider instance (Mock or Groq).

    Resolution table:
        DATA_SOURCE=mock    → MockAIProvider (always)
        DATA_SOURCE=real    → GroqAIProvider (or Mock fallback if key missing)
        DATA_SOURCE=hybrid  → GroqAIProvider (or Mock fallback if key missing)
    """
    mode = settings.DATA_SOURCE.lower()

    if mode == "mock":
        logger.debug("AIResolver: DATA_SOURCE=mock → MockAIProvider selected.")
        return _mock_provider

    # real or hybrid — prefer Groq, fall back gracefully to Mock
    if _groq_provider.is_available():
        logger.debug(
            "AIResolver: DATA_SOURCE=%s → GroqAIProvider selected.", mode
        )
        return _groq_provider

    # Graceful ADSA fallback
    logger.warning(
        "AIResolver: DATA_SOURCE=%s but GroqAIProvider unavailable "
        "(GROQ_API_KEY not set or SDK missing). "
        "Falling back to MockAIProvider.", mode
    )
    return _mock_provider


from sqlalchemy.ext.asyncio import AsyncSession

def get_ai_repository(db: AsyncSession) -> AIRepository:
    """
    ADSA AI Repository Resolver.
    Selects between Mock and Real repositories depending on active settings configuration.
    """
    mode = settings.DATA_SOURCE.lower()
    if mode == "real":
        return RealAIRepository(db)
    else:
        return _mock_repository_instance
