from pydantic import BaseModel, Field
from typing import Optional, Any, List
from datetime import date, datetime

class StudentProfileBase(BaseModel):
    roll_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    user_id: int
    class_id: Optional[int] = None

class StudentProfileUpdate(StudentProfileBase):
    pass

class StudentProfileDTO(StudentProfileBase):
    id: int
    user_id: int
    class_id: Optional[int] = None
    first_name: str
    last_name: str
    email: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Standard Response wrappers conforming to 06_API_Contract.md
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class StudentProfileResponse(APIResponse):
    data: StudentProfileDTO

# Student Dashboard DTO
class StudentDashboardDTO(BaseModel):
    academic_overview: dict = Field(default={"gpa": 3.8, "rank": 5, "completed_credits": 45, "total_credits": 60})
    attendance: dict = Field(default={"present_percentage": 92.5, "total_days": 80, "days_present": 74})
    workload: dict = Field(default={"pending_assignments": 3, "due_this_week": 1, "completed_assignments": 12})
    learning_health: dict = Field(default={"score": 85, "status": "Healthy", "weak_concepts_count": 2})
    growth_passport: dict = Field(default={"holistic_score": 78, "badges_count": 4, "achievements_count": 3})
    notifications: dict = Field(default={"unread_count": 2})
    workload_pressure_trend: Optional[List[dict]] = Field(default_factory=list)
    subject_growth_trend: Optional[List[dict]] = Field(default_factory=list)
    extracurricular_analytics: Optional[List[dict]] = Field(default_factory=list)

class StudentDashboardResponse(APIResponse):
    data: StudentDashboardDTO

# Study Plan / Exam Plan DTOs
class StudyPlanDTO(BaseModel):
    id: int
    student_id: int
    plan_type: str
    plan_data: dict
    created_at: datetime

    class Config:
        from_attributes = True

class StudyPlanResponse(APIResponse):
    data: StudyPlanDTO

# Opportunity recommendation DTO
class OpportunityDTO(BaseModel):
    id: int
    title: str
    description: str
    opportunity_type: str  # e.g., Scholarship, Competition, Hackathon, Club
    organization: str
    deadline: date
    recommended_reason: str

class OpportunityListResponse(APIResponse):
    data: List[OpportunityDTO]


# Student Doubt DTOs
class DoubtCreate(BaseModel):
    teacher_id: int
    subject_id: int
    title: str = Field(..., min_length=3, max_length=150)
    query: str = Field(..., min_length=5, max_length=1000)

class DoubtDTO(BaseModel):
    id: int
    student_id: int
    teacher_id: int
    subject_id: int
    subject_name: Optional[str] = "General"
    teacher_name: Optional[str] = "Faculty Teacher"
    title: str
    query: str
    response: Optional[str] = None
    status: str  # Pending, Answered, Resolved
    created_at: str

class DoubtResponse(APIResponse):
    data: DoubtDTO

class DoubtListResponse(APIResponse):
    data: List[DoubtDTO]

class StudentTimetableSlotDTO(BaseModel):
    id: int
    class_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    day_of_week: str
    period_number: int = 1
    start_time: str
    end_time: str
    is_published: bool = True
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    teacher_name: Optional[str] = None

class StudentTimetableListResponse(APIResponse):
    data: List[StudentTimetableSlotDTO]


