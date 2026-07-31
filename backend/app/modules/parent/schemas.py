from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.modules.student.schemas import APIResponse

class ParentProfileDTO(BaseModel):
    id: int
    user_id: int
    phone: Optional[str] = None
    address: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    is_active: bool

# Parent Dashboard DTO
class ParentDashboardDTO(BaseModel):
    linked_students: List[dict] = Field(
        default=[
            {
                "student_id": 1,
                "first_name": "Rahul",
                "last_name": "B",
                "class_name": "Grade 10-A",
                "academic_progress": {
                    "gpa": 3.8,
                    "grade": "A"
                },
                "attendance": {
                    "percentage": 92.5,
                    "status": "Good"
                },
                "growth_passport": {
                    "holistic_score": 78,
                    "growth_level": "Advanced"
                },
                "workload_overview": {
                    "pending_assignments": 3,
                    "overload_status": "Normal"
                },
                "recent_achievements": [
                    {"title": "First Place Science Fair", "category": "Academic"},
                    {"title": "Captaincy", "category": "Leadership"}
                ]
            }
        ]
    )

class ParentDashboardResponse(APIResponse):
    data: ParentDashboardDTO

# Simulated Bus Tracking DTO
class BusTrackingDTO(BaseModel):
    route_name: str = "Route 12 - South Side"
    driver_name: str = "David Miller"
    driver_phone: str = "+15550199"
    vehicle_number: str = "BUS-2026-X"
    current_location: dict = {"latitude": 12.9716, "longitude": 77.5946}
    boarding_status: str = "Boarded"
    arrival_status: str = "On the way"
    departure_status: str = "Departed from school"
    estimated_arrival_time: str = "08:15 AM"

class BusTrackingResponse(APIResponse):
    data: BusTrackingDTO

# AI Coach schemas
class AICoachQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Parent's query to the AI Coach")

class AICoachAdviceDTO(BaseModel):
    id: int
    query: str
    response: str
    created_at: datetime

class AICoachResponse(APIResponse):
    data: AICoachAdviceDTO

class AICoachHistoryResponse(APIResponse):
    data: List[AICoachAdviceDTO]
