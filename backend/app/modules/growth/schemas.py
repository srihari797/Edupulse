from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.modules.student.schemas import APIResponse

# Achievements schemas
class AchievementDTO(BaseModel):
    id: int
    student_id: int
    title: str
    description: Optional[str] = None
    category: str
    date_earned: date
    badge_name: Optional[str] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Activities schemas
class ActivityDTO(BaseModel):
    id: int
    student_id: int
    name: str
    description: Optional[str] = None
    activity_type: str
    hours_spent: float
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Growth Passport schema
class GrowthPassportDTO(BaseModel):
    id: int
    student_id: int
    holistic_score: float
    growth_level: str
    achievements: List[AchievementDTO]
    activities: List[ActivityDTO]

    class Config:
        from_attributes = True

class GrowthPassportResponse(APIResponse):
    data: GrowthPassportDTO

# Recognition API DTO
class RecognitionDTO(BaseModel):
    badges: List[dict]
    milestones: List[dict]
    recent_achievements: List[AchievementDTO]

class RecognitionResponse(APIResponse):
    data: RecognitionDTO
