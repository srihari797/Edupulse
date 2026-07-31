from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import date, datetime
from sqlalchemy import select
from app.modules.growth.models import GrowthPassport, Achievement, Activity

class GrowthRepository(ABC):
    """
    Interface for Growth Repository.
    """
    @abstractmethod
    async def get_passport_by_student_id(self, student_id: int) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_achievements_by_student_id(self, student_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_activities_by_student_id(self, student_id: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_recognition_by_student_id(self, student_id: int) -> Dict[str, Any]:
        pass

class MockGrowthRepository(GrowthRepository):
    """
    Mock implementation of GrowthRepository.
    """
    def __init__(self):
        self.mock_passports = {
            1: {
                "id": 1,
                "student_id": 1,
                "holistic_score": 78.5,
                "growth_level": "Advanced",
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "is_active": True
            }
        }
        
        self.mock_achievements = {
            1: [
                {
                    "id": 101,
                    "student_id": 1,
                    "title": "First Place Science Fair",
                    "description": "Awarded first prize in school science project competition.",
                    "category": "Academic",
                    "date_earned": date(2026, 2, 10),
                    "badge_name": "Einstein Scholar",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "is_active": True
                },
                {
                    "id": 102,
                    "student_id": 1,
                    "title": "100m Athletic Gold",
                    "description": "Won gold medal at annual school athletics meet.",
                    "category": "Sports",
                    "date_earned": date(2026, 4, 5),
                    "badge_name": "Lightning Bolt",
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "is_active": True
                }
            ]
        }

        self.mock_activities = {
            1: [
                {
                    "id": 201,
                    "student_id": 1,
                    "name": "Robotics Club",
                    "description": "Active participant in school robotics training and design club.",
                    "activity_type": "Club",
                    "hours_spent": 24.5,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "is_active": True
                },
                {
                    "id": 202,
                    "student_id": 1,
                    "name": "Community Library Volunteer",
                    "description": "Volunteered to catalog books and assist visitors.",
                    "activity_type": "Volunteer",
                    "hours_spent": 12.0,
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "is_active": True
                }
            ]
        }

    async def get_passport_by_student_id(self, student_id: int) -> Optional[Dict[str, Any]]:
        passport = self.mock_passports.get(student_id)
        if not passport:
            return None
        # Add relation fields dynamically
        passport["achievements"] = self.mock_achievements.get(student_id, [])
        passport["activities"] = self.mock_activities.get(student_id, [])
        return passport

    async def get_achievements_by_student_id(self, student_id: int) -> List[Dict[str, Any]]:
        return self.mock_achievements.get(student_id, [])

    async def get_activities_by_student_id(self, student_id: int) -> List[Dict[str, Any]]:
        return self.mock_activities.get(student_id, [])

    async def get_recognition_by_student_id(self, student_id: int) -> Dict[str, Any]:
        achievements = self.mock_achievements.get(student_id, [])
        badges = []
        milestones = []
        for ach in achievements:
            if ach.get("badge_name"):
                badges.append({
                    "name": ach["badge_name"],
                    "description": f"Earned for achievement: {ach['title']}",
                    "date_earned": ach["date_earned"]
                })
            milestones.append({
                "title": ach["title"],
                "date": ach["date_earned"]
            })
        return {
            "badges": badges,
            "milestones": milestones,
            "recent_achievements": achievements
        }

class RealGrowthRepository(GrowthRepository):
    """
    SQLAlchemy-based database repository for Growth module.
    """
    def __init__(self, db_session):
        self.db = db_session

    async def resolve_student_profile_id(self, user_or_student_id: int) -> int:
        from app.modules.student.models import StudentProfile
        stmt = select(StudentProfile.id).where(StudentProfile.user_id == user_or_student_id)
        res = await self.db.execute(stmt)
        sp_id = res.scalar_one_or_none()
        if sp_id:
            return sp_id
        return user_or_student_id

    async def get_passport_by_student_id(self, user_or_student_id: int) -> Optional[Dict[str, Any]]:
        student_id = await self.resolve_student_profile_id(user_or_student_id)

        stmt = select(GrowthPassport).where(GrowthPassport.student_id == student_id)
        result = await self.db.execute(stmt)
        passport = result.scalar_one_or_none()
        
        if not passport:
            passport = GrowthPassport(
                student_id=student_id,
                holistic_score=88.5,
                growth_level="Advanced Scholar"
            )
            self.db.add(passport)
            await self.db.commit()
            await self.db.refresh(passport)
        
        achievements = await self.get_achievements_by_student_id(student_id)
        activities = await self.get_activities_by_student_id(student_id)
        return {
            "id": passport.id,
            "student_id": passport.student_id,
            "holistic_score": passport.holistic_score,
            "growth_level": passport.growth_level,
            "achievements": achievements,
            "activities": activities
        }

    async def get_achievements_by_student_id(self, user_or_student_id: int) -> List[Dict[str, Any]]:
        student_id = await self.resolve_student_profile_id(user_or_student_id)
        stmt = select(Achievement).where(Achievement.student_id == student_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        return [
            {
                "id": item.id,
                "student_id": item.student_id,
                "title": item.title,
                "description": item.description,
                "category": item.category,
                "date_earned": str(item.date_earned),
                "badge_name": item.badge_name,
                "created_at": str(item.created_at),
                "is_active": item.is_active
            }
            for item in items
        ]

    async def get_activities_by_student_id(self, user_or_student_id: int) -> List[Dict[str, Any]]:
        student_id = await self.resolve_student_profile_id(user_or_student_id)
        stmt = select(Activity).where(Activity.student_id == student_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        return [
            {
                "id": item.id,
                "student_id": item.student_id,
                "name": item.name,
                "description": item.description,
                "activity_type": item.activity_type,
                "hours_spent": item.hours_spent,
                "created_at": str(item.created_at),
                "is_active": item.is_active
            }
            for item in items
        ]

    async def get_recognition_by_student_id(self, user_or_student_id: int) -> Dict[str, Any]:
        student_id = await self.resolve_student_profile_id(user_or_student_id)
        achievements = await self.get_achievements_by_student_id(student_id)
        badges = []
        milestones = []
        for ach in achievements:
            if ach.get("badge_name"):
                badges.append({
                    "name": ach["badge_name"],
                    "description": f"Earned for achievement: {ach['title']}",
                    "date_earned": str(ach["date_earned"])
                })
            milestones.append({
                "title": ach["title"],
                "date": str(ach["date_earned"])
            })
        return {
            "badges": badges,
            "milestones": milestones,
            "recent_achievements": achievements
        }
