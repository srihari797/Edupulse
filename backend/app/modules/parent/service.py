from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.parent.repository import ParentRepository, RealParentRepository

class ParentService:
    """
    Business Service Layer for Parent Module.
    """
    def __init__(self, repository: ParentRepository, db: Optional[AsyncSession] = None):
        self.repository = repository
        self.db = db

    async def get_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_parent_profile_by_user_id(user_id)

    async def get_dashboard(self, user_id: int, mode: Optional[str] = None) -> Dict[str, Any]:
        if mode and mode.lower() == "real":
            active_db = self.db if self.db is not None else getattr(self.repository, "db", None)
            real_repo = RealParentRepository(active_db)
            return await real_repo.get_dashboard_data(user_id, mode=mode)
        return await self.repository.get_dashboard_data(user_id, mode=mode)

    async def get_bus_tracking(self, user_id: int) -> Dict[str, Any]:
        return await self.repository.get_bus_tracking_data(user_id)

    async def ask_ai_coach(self, parent_id: int, query: str) -> Dict[str, Any]:
        from app.modules.parent.ai.service import ParentAICoachService
        ai_service = ParentAICoachService(self.repository, db=self.db)
        return await ai_service.ask_ai_coach(parent_id, query)

    async def get_ai_coach_history(self, parent_id: int) -> List[Dict[str, Any]]:
        return await self.repository.get_ai_coach_history(parent_id)
