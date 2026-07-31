from typing import Optional, Dict, Any, List
from app.modules.growth.repository import GrowthRepository

class GrowthService:
    """
    Business Service Layer for Growth Module.
    """
    def __init__(self, repository: GrowthRepository):
        self.repository = repository

    async def get_passport(self, student_id: int) -> Optional[Dict[str, Any]]:
        return await self.repository.get_passport_by_student_id(student_id)

    async def get_recognition(self, student_id: int) -> Dict[str, Any]:
        return await self.repository.get_recognition_by_student_id(student_id)
