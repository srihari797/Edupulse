from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.parent.ai.client import GroqClient
from app.modules.parent.ai.context_builder import StudentContextBuilder
from app.modules.parent.ai.prompt_builder import AIPromptBuilder

class ParentAICoachService:
    """
    Dedicated AI Service Layer for Parent AI Coach.
    Orchestrates Context Builder, Prompt Builder, Groq Client, and History Storage.
    """
    def __init__(self, repository: Any, db: Optional[AsyncSession] = None):
        self.repository = repository
        self.db = db
        self.groq_client = GroqClient()
        self.context_builder = StudentContextBuilder(repository, db=db)

    async def ask_ai_coach(self, parent_id: int, query: str) -> Dict[str, Any]:
        """
        Processes parent question using linked student's database context & Groq AI engine.
        """
        # 1. Gather linked student's real database context
        student_contexts = await self.context_builder.build_parent_student_context(parent_id)

        # 2. Fetch past conversation history
        chat_history = []
        try:
            chat_history = await self.repository.get_ai_coach_history(parent_id)
        except Exception:
            chat_history = []

        # 3. Assemble prompt messages
        messages = AIPromptBuilder.build_prompt_messages(
            query=query,
            student_contexts=student_contexts,
            chat_history=chat_history
        )

        # 4. Invoke Groq API
        ai_response = await self.groq_client.generate_chat_completion(messages=messages, timeout_seconds=8)

        # 5. Use context-based fallback response if Groq API is offline/unavailable
        if not ai_response:
            ai_response = AIPromptBuilder.generate_fallback_response(
                query=query,
                student_contexts=student_contexts
            )

        # 6. Save query and generated advice into database history
        saved_advice = await self.repository.save_ai_coach_advice(parent_id, query, ai_response)
        return saved_advice
