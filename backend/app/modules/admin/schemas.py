from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any,Dict
from app.modules.student.schemas import APIResponse

class AdminUserCreate(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: int

class AdminUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class AdminUserResetPassword(BaseModel):
    password: str

class AdminUserDTO(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: bool

class AdminUserResponse(APIResponse):
    data: AdminUserDTO

class AdminUserListResponse(APIResponse):
    data: List[AdminUserDTO]

# Class DTOs
class ClassCreate(BaseModel):
    name: str
    grade: Optional[str] = None
    section: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None
    section: Optional[str] = None
    is_active: Optional[bool] = None

class ClassDTO(BaseModel):
    id: int
    name: str
    grade: Optional[str] = None
    section: Optional[str] = None
    is_active: bool

class ClassResponse(APIResponse):
    data: ClassDTO

class ClassListResponse(APIResponse):
    data: List[ClassDTO]

# Section DTOs
class SectionCreate(BaseModel):
    name: str

class SectionUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class SectionDTO(BaseModel):
    id: int
    name: str
    is_active: bool

class SectionResponse(APIResponse):
    data: SectionDTO

class SectionListResponse(APIResponse):
    data: List[SectionDTO]

# Subject DTOs
class SubjectCreate(BaseModel):
    name: str
    code: str

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[bool] = None

class SubjectDTO(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool

class SubjectResponse(APIResponse):
    data: SubjectDTO

class SubjectListResponse(APIResponse):
    data: List[SubjectDTO]

# Academic Year DTOs
class AcademicYearCreate(BaseModel):
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None

class AcademicYearDTO(BaseModel):
    id: int
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool

class AcademicYearResponse(APIResponse):
    data: AcademicYearDTO

class AcademicYearListResponse(APIResponse):
    data: List[AcademicYearDTO]

# Teacher Assignment DTOs
class TeacherAssignmentCreate(BaseModel):
    teacher_id: int
    class_id: int
    subject_id: int
    is_homeroom: bool = False

class TeacherAssignmentDTO(BaseModel):
    id: int
    teacher_id: int
    class_id: int
    subject_id: int
    is_homeroom: bool
    created_at: str

class TeacherAssignmentResponse(APIResponse):
    data: TeacherAssignmentDTO

class TeacherAssignmentListResponse(APIResponse):
    data: List[TeacherAssignmentDTO]

# Student Management DTOs
class StudentClassMapRequest(BaseModel):
    student_id: int
    class_id: int

class ParentLinkRequest(BaseModel):
    student_id: int
    parent_id: int

class StudentPromotionRequest(BaseModel):
    student_ids: List[int]
    target_class_id: int

class ParentLinkDTO(BaseModel):
    id: int
    student_id: int
    parent_id: int
    created_at: str

class ParentLinkResponse(APIResponse):
    data: ParentLinkDTO

class StudentPromotionDTO(BaseModel):
    promoted_count: int
    target_class_id: int

class StudentPromotionResponse(APIResponse):
    data: StudentPromotionDTO

# School Configuration DTOs
class TimetableSlotCreate(BaseModel):
    class_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    day_of_week: str
    period_number: Optional[int] = 1
    start_time: str
    end_time: str
    is_published: Optional[bool] = True

class TimetableSlotDTO(BaseModel):
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

class TimetableSlotResponse(APIResponse):
    data: TimetableSlotDTO

class TimetableSlotListResponse(APIResponse):
    data: List[TimetableSlotDTO]

class TimetableSlotItemRequest(BaseModel):
    day_of_week: str
    period_number: int
    subject_id: int
    teacher_id: int
    start_time: Optional[str] = "09:00"
    end_time: Optional[str] = "09:45"

class TimetablePublishRequest(BaseModel):
    class_id: int
    working_days: List[str]
    periods_per_day: int
    slots: List[TimetableSlotItemRequest]

class TeacherAvailabilityDTO(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    subject_name: Optional[str] = None
    subject_id: Optional[int] = None
    assigned_classes: List[str] = []
    status: str = "Available"

class TeacherAvailabilityListResponse(APIResponse):
    data: List[TeacherAvailabilityDTO]


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str
    is_holiday: bool = False

class CalendarEventDTO(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    event_date: str
    is_holiday: bool

class CalendarEventResponse(APIResponse):
    data: CalendarEventDTO

class CalendarEventListResponse(APIResponse):
    data: List[CalendarEventDTO]

class SystemSettingCreate(BaseModel):
    key: str
    value: str

class SystemSettingDTO(BaseModel):
    id: int
    key: str
    value: str

class SystemSettingResponse(APIResponse):
    data: SystemSettingDTO

class SystemSettingListResponse(APIResponse):
    data: List[SystemSettingDTO]

# Admin Dashboard DTOs
class AdminDashboardDTO(BaseModel):
    student_count: int
    teacher_count: int
    class_count: int
    system_status: str
    active_alerts_count: int

class AdminDashboardResponse(APIResponse):
    data: AdminDashboardDTO

# AI Timetable Insights DTOs
class TimetableAnalyzeRequest(BaseModel):
    slots: List[Dict[str, Any]]
    class_name: str
    working_days: int
    periods_per_day: int

class AIWarningItem(BaseModel):
    message: str

class TimetableAnalyzeResponseData(BaseModel):
    analysis: str
    warnings: List[AIWarningItem]

class TimetableAnalyzeResponse(APIResponse):
    data: TimetableAnalyzeResponseData
