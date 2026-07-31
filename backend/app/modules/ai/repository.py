"""
repository.py — AI Module Repository

Stores and retrieves AI interaction history (requests + responses) for
the EduPulse AI Intelligence Platform.

ADSA Pattern:
  - AIRepository         → Abstract base (interface contract)
  - MockAIRepository     → In-memory store (used in MOCK / HYBRID fallback)
  - RealAIRepository     → SQLAlchemy (used when DATA_SOURCE == "real")

Every AI endpoint persists its response here so:
  1. Users can review past AI insights from dashboards.
  2. The Growth Passport engine can reference historical AI outputs.
  3. Usage tracking is available for analytics.

Architecture rule (from 09_Coding_Guidelines.md):
  - Repository handles data access only — no business logic.
  - Service layer calls repository methods, never raw SQL.
"""

from abc import ABC, abstractmethod
from typing import Optional
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Domain model — shared across Mock and Real implementations
# ---------------------------------------------------------------------------

class AIInteraction:
    """
    Represents a single AI request-response interaction.

    Attributes:
        id:               Unique interaction ID (UUID string).
        user_id:          ID of the authenticated user who triggered the request.
        template_key:     Prompt template used (e.g. "workload_analysis").
        engine_name:      AI engine that processed the request.
        provider_name:    Provider used ("gemini" or "mock").
        request_summary:  Short summary of the context (for display, not PII-heavy).
        response_text:    Full AI-generated response text.
        tokens_used:      Estimated token count (0 for mock responses).
        created_at:       UTC timestamp of the interaction.
    """
    def __init__(
        self,
        id: str,
        user_id: int,
        template_key: str,
        engine_name: str,
        provider_name: str,
        request_summary: str,
        response_text: str,
        tokens_used: int,
        created_at: datetime,
    ):
        self.id             = id
        self.user_id        = user_id
        self.template_key   = template_key
        self.engine_name    = engine_name
        self.provider_name  = provider_name
        self.request_summary = request_summary
        self.response_text  = response_text
        self.tokens_used    = tokens_used
        self.created_at     = created_at

    def to_dict(self) -> dict:
        return {
            "id":               self.id,
            "user_id":          self.user_id,
            "template_key":     self.template_key,
            "engine_name":      self.engine_name,
            "provider_name":    self.provider_name,
            "request_summary":  self.request_summary,
            "response_text":    self.response_text,
            "tokens_used":      self.tokens_used,
            "created_at":       self.created_at.isoformat(),
        }


# ---------------------------------------------------------------------------
# Abstract Repository
# ---------------------------------------------------------------------------

class AIRepository(ABC):
    """Abstract AI interaction repository. Both Mock and Real must implement this."""

    @abstractmethod
    async def save_interaction(
        self,
        user_id: int,
        template_key: str,
        engine_name: str,
        provider_name: str,
        request_summary: str,
        response_text: str,
        tokens_used: int = 0,
    ) -> AIInteraction:
        """Persist a new AI interaction and return the saved record."""
        ...

    @abstractmethod
    async def get_interaction(self, interaction_id: str) -> Optional[AIInteraction]:
        """Retrieve a single AI interaction by ID."""
        ...

    @abstractmethod
    async def get_user_interactions(
        self,
        user_id: int,
        template_key: Optional[str] = None,
        limit: int = 10,
    ) -> list[AIInteraction]:
        """
        List recent AI interactions for a given user.

        Args:
            user_id:      Filter by user.
            template_key: Optional — filter by AI engine type.
            limit:        Maximum number of records to return.

        Returns:
            List of AIInteraction objects, newest first.
        """
        ...


# ---------------------------------------------------------------------------
# Mock Repository — in-memory, singleton-safe
# ---------------------------------------------------------------------------

class MockAIRepository(AIRepository):
    """
    In-memory mock implementation of AIRepository.

    State persists for the lifetime of the process (module-scoped singleton),
    so POST → GET sequences work correctly during development and testing.
    """

    def __init__(self):
        # key: interaction_id → AIInteraction
        self._store: dict[str, AIInteraction] = {}

    async def save_interaction(
        self,
        user_id: int,
        template_key: str,
        engine_name: str,
        provider_name: str,
        request_summary: str,
        response_text: str,
        tokens_used: int = 0,
    ) -> AIInteraction:
        interaction = AIInteraction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            template_key=template_key,
            engine_name=engine_name,
            provider_name=provider_name,
            request_summary=request_summary,
            response_text=response_text,
            tokens_used=tokens_used,
            created_at=datetime.now(timezone.utc),
        )
        self._store[interaction.id] = interaction
        return interaction

    async def get_interaction(self, interaction_id: str) -> Optional[AIInteraction]:
        return self._store.get(interaction_id)

    async def get_user_interactions(
        self,
        user_id: int,
        template_key: Optional[str] = None,
        limit: int = 10,
    ) -> list[AIInteraction]:
        results = [
            i for i in self._store.values()
            if i.user_id == user_id
            and (template_key is None or i.template_key == template_key)
        ]
        # Sort newest first
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results[:limit]


# ---------------------------------------------------------------------------
# Real Repository — SQLAlchemy async implementation
# ---------------------------------------------------------------------------

class RealAIRepository(AIRepository):
    """
    SQLAlchemy-backed AI interaction repository.
    Used when DATA_SOURCE == "real" and a live database is connected.

    Note: Requires an `ai_interactions` table in the database schema.
    For MVP, falls back to MockAIRepository via resolver.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def save_interaction(
        self,
        user_id: int,
        template_key: str,
        engine_name: str,
        provider_name: str,
        request_summary: str,
        response_text: str,
        tokens_used: int = 0,
    ) -> AIInteraction:
        # MVP: Real DB persistence placeholder.
        # Will be implemented when Supabase schema is migrated.
        # For now, returns a transient AIInteraction (not persisted).
        return AIInteraction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            template_key=template_key,
            engine_name=engine_name,
            provider_name=provider_name,
            request_summary=request_summary,
            response_text=response_text,
            tokens_used=tokens_used,
            created_at=datetime.now(timezone.utc),
        )

    async def get_interaction(self, interaction_id: str) -> Optional[AIInteraction]:
        # MVP placeholder — real SELECT query goes here
        return None

    async def get_user_interactions(
        self,
        user_id: int,
        template_key: Optional[str] = None,
        limit: int = 10,
    ) -> list[AIInteraction]:
        # MVP placeholder — real SELECT query goes here
        return []
