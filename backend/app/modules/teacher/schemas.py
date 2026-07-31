from pydantic import BaseModel, Field
from typing import Optional, List, Any
from app.modules.student.schemas import APIResponse

class TeacherProfileDTO(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    department: Optional[str] = None
    first_name: str
    last_name: str
    email: str
    is_active: bool

class TeacherProfileUpdatePayload(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    department: Optional[str] = Field(None, max_length=100)

class TeacherProfileResponse(APIResponse):
    data: TeacherProfileDTO

# Teacher Dashboard DTO
class TeacherDashboardDTO(BaseModel):
    classroom_summary: dict = Field(
        default={
            "class_name": "Grade 10-A",
            "student_count": 28,
            "average_attendance": 94.2
        }
    )
    workload_overview: dict = Field(
        default={
            "active_assignments": 4,
            "pending_grading": 18,
            "upcoming_exams": 2
        }
    )
    student_insights: List[dict] = Field(
        default=[
            {"student_name": "Rahul B", "insight": "High mastery in Science, needs help with algebra"},
            {"student_name": "Alice Smith", "insight": "Participation has increased in class debates"}
        ]
    )
    risk_alerts: List[dict] = Field(
        default=[
            {"student_name": "Bob Johnson", "risk_level": "High", "reason": "Attendance dropped below 80%"},
            {"student_name": "Charlie Brown", "risk_level": "Medium", "reason": "Failed last two math quizzes"}
        ]
    )

class TeacherDashboardResponse(APIResponse):
    data: TeacherDashboardDTO

# Classroom Health DTO
class ClassroomHealthDTO(BaseModel):
    class_id: int
    class_name: str
    average_gpa: float
    average_attendance: float
    weak_topics: List[str]
    performance_distribution: dict

class ClassroomHealthResponse(APIResponse):
    data: ClassroomHealthDTO

# Learning DNA DTO
class LearningDNADTO(BaseModel):
    student_id: int
    student_name: str
    cognitive_profile: dict
    strengths: List[str]
    improvement_areas: List[str]
    recommended_strategies: List[str]

class LearningDNAResponse(APIResponse):
    data: LearningDNADTO

# Risk Alert DTO
class RiskAlertDTO(BaseModel):
    student_id: int
    student_name: str
    risk_level: str
    reason: str
    metric_triggered: str
    alert_date: str
    ai_recommendation: Optional[str] = None

class RiskAlertsListResponse(APIResponse):
    data: List[RiskAlertDTO]

# Shared Goal DTOs
class SharedGoalCreate(BaseModel):
    student_id: int
    teacher_id: int
    parent_id: int
    title: str = Field(..., max_length=150)
    description: str = Field(..., max_length=500)
    target_date: Optional[str] = None

class SharedGoalUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=50)
    target_date: Optional[str] = None

class SharedGoalDTO(BaseModel):
    id: int
    student_id: int
    teacher_id: int
    parent_id: int
    title: str
    description: str
    status: str
    target_date: Optional[str] = None
    created_at: str

class SharedGoalResponse(APIResponse):
    data: SharedGoalDTO

class SharedGoalListResponse(APIResponse):
    data: List[SharedGoalDTO]


# Classroom Assignments DTOs
class AssignmentCreate(BaseModel):
    subject_id: int
    class_id: int
    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    instructions: Optional[str] = Field(None, max_length=500)
    max_marks: Optional[int] = 100
    is_graded: Optional[bool] = True
    has_deadline: Optional[bool] = False
    due_date: Optional[str] = None
    notify_parent_on_overdue: Optional[bool] = False
    status: Optional[str] = "Draft"  # Draft, Published, Closed
    published_at: Optional[str] = None
    attachment_bucket: Optional[str] = None
    attachment_path: Optional[str] = None

class AssignmentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    instructions: Optional[str] = Field(None, max_length=500)
    max_marks: Optional[int] = None
    is_graded: Optional[bool] = None
    has_deadline: Optional[bool] = None
    due_date: Optional[str] = None
    notify_parent_on_overdue: Optional[bool] = None
    status: Optional[str] = Field(None, max_length=50)
    published_at: Optional[str] = None
    attachment_bucket: Optional[str] = None
    attachment_path: Optional[str] = None

class AssignmentDTO(BaseModel):
    id: int
    teacher_id: int
    subject_id: int
    class_id: int
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    max_marks: int
    is_graded: bool = True
    has_deadline: bool = False
    due_date: Optional[str] = None
    notify_parent_on_overdue: bool = False
    status: str
    published_at: Optional[str] = None
    attachment_bucket: Optional[str] = None
    attachment_path: Optional[str] = None
    created_at: str

class AssignmentResponse(APIResponse):
    data: AssignmentDTO

class AssignmentListResponse(APIResponse):
    data: List[AssignmentDTO]


# Submission DTOs
class SubmissionSubmit(BaseModel):
    file_bucket: str = Field(..., max_length=100)
    file_path: str = Field(..., max_length=200)

class SubmissionGrade(BaseModel):
    score: int
    feedback: Optional[str] = Field(None, max_length=500)

class SubmissionDTO(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    status: str
    submitted_at: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    file_bucket: Optional[str] = None
    file_path: Optional[str] = None
    created_at: str

class SubmissionResponse(APIResponse):
    data: SubmissionDTO

class SubmissionListResponse(APIResponse):
    data: List[SubmissionDTO]


# Enhanced Teacher Student & Submission DTOs
class TeacherStudentDTO(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    roll_number: Optional[str] = None
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    academic_score: int
    completion_rate: int

class TeacherStudentListResponse(APIResponse):
    data: List[TeacherStudentDTO]

class StudentDetailReportDTO(BaseModel):
    student_id: int
    user_id: int
    name: str
    email: str
    class_name: str
    roll_number: str
    overall_academic_score: int
    completion_rate: int
    submitted_count: int
    pending_count: int
    overdue_count: int
    submissions: List[dict]

class StudentDetailReportResponse(APIResponse):
    data: StudentDetailReportDTO

class SubmissionReviewDTO(BaseModel):
    submission_id: int
    assignment_id: int
    assignment_title: str
    class_id: int
    class_name: str
    student_id: int
    student_name: str
    status: str
    submitted_at: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    file_bucket: Optional[str] = None
    file_path: Optional[str] = None

class SubmissionReviewListResponse(APIResponse):
    data: List[SubmissionReviewDTO]


# Learning Resource DTOs
class LearningResourceCreate(BaseModel):
    subject_id: int
    title: str = Field(..., max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    file_bucket: str = Field(..., max_length=100)
    file_path: str = Field(..., max_length=200)

class LearningResourceDTO(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    title: str
    description: Optional[str] = None
    file_bucket: str
    file_path: str
    created_at: str

class LearningResourceResponse(APIResponse):
    data: LearningResourceDTO

class LearningResourceListResponse(APIResponse):
    data: List[LearningResourceDTO]

# Teacher Timetable DTOs
class TeacherTimetableSlotDTO(BaseModel):
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

class TeacherTimetableSummaryDTO(BaseModel):
    todays_classes: int
    weekly_classes: int
    free_periods: int
    assigned_classes: List[str]

class TeacherTimetableDataDTO(BaseModel):
    summary: TeacherTimetableSummaryDTO
    slots: List[TeacherTimetableSlotDTO]

class TeacherTimetableResponse(APIResponse):
    data: TeacherTimetableDataDTO

