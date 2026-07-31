from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AICoachQuerySchema(BaseModel):
    query: str
    student_id: Optional[int] = None

class StudentContextData(BaseModel):
    student_id: int
    first_name: str
    last_name: str
    class_name: str
    gpa: float
    grade: str
    attendance_percentage: float
    attendance_status: str
    holistic_score: float
    growth_level: str
    pending_assignments: int
    overload_status: str
    recent_achievements: List[Dict[str, str]]
