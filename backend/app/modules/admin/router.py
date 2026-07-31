from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.modules.admin.resolver import (
    get_admin_user_repository, get_academic_repository, get_teacher_management_repository, get_student_management_repository, get_config_repository, get_admin_dashboard_repository
)
from app.modules.admin.service import AdminUserService, AcademicService, TeacherManagementService, StudentManagementService, ConfigService, AdminDashboardService
from app.modules.admin.schemas import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserResetPassword,
    AdminUserDTO,
    AdminUserResponse,
    AdminUserListResponse,
    ClassCreate,
    ClassUpdate,
    ClassDTO,
    ClassResponse,
    ClassListResponse,
    SectionCreate,
    SectionUpdate,
    SectionDTO,
    SectionResponse,
    SectionListResponse,
    SubjectCreate,
    SubjectUpdate,
    SubjectDTO,
    SubjectResponse,
    SubjectListResponse,
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearDTO,
    AcademicYearResponse,
    AcademicYearListResponse,
    TeacherAssignmentCreate,
    TeacherAssignmentDTO,
    TeacherAssignmentResponse,
    TeacherAssignmentListResponse,
    StudentClassMapRequest,
    ParentLinkRequest,
    StudentPromotionRequest,
    ParentLinkDTO,
    ParentLinkResponse,
    StudentPromotionDTO,
    StudentPromotionResponse,
    TimetableSlotCreate,
    TimetableSlotDTO,
    TimetableSlotResponse,
    TimetableSlotListResponse,
    TimetablePublishRequest,
    TeacherAvailabilityDTO,
    TeacherAvailabilityListResponse,
    TimetableAnalyzeRequest,
    TimetableAnalyzeResponse,

    CalendarEventCreate,
    CalendarEventDTO,
    CalendarEventResponse,
    CalendarEventListResponse,
    SystemSettingCreate,
    SystemSettingDTO,
    SystemSettingResponse,
    SystemSettingListResponse,
    AdminDashboardDTO,
    AdminDashboardResponse
)

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_admin(
    current_user: UserDTO = Depends(get_current_user)
) -> UserDTO:
    """
    Dependency verifying that the user is authenticated and has the Admin role (role_id = 4).
    """
    if current_user.role_id != 4:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User role is not authorized to access Admin endpoints."
        )
    return current_user


def get_admin_user_service(
    db: AsyncSession = Depends(get_db)
) -> AdminUserService:
    repository = get_admin_user_repository(db)
    return AdminUserService(repository)

def get_academic_service(
    db: AsyncSession = Depends(get_db)
) -> AcademicService:
    repository = get_academic_repository(db)
    return AcademicService(repository)

def get_teacher_management_service(
    db: AsyncSession = Depends(get_db)
) -> TeacherManagementService:
    repository = get_teacher_management_repository(db)
    return TeacherManagementService(repository)

def get_student_management_service(
    db: AsyncSession = Depends(get_db)
) -> StudentManagementService:
    repository = get_student_management_repository(db)
    return StudentManagementService(repository)

def get_config_service(
    db: AsyncSession = Depends(get_db)
) -> ConfigService:
    repository = get_config_repository(db)
    return ConfigService(repository)

def get_admin_dashboard_service(
    db: AsyncSession = Depends(get_db)
) -> AdminDashboardService:
    repository = get_admin_dashboard_repository(db)
    return AdminDashboardService(repository)

# Users CRUD
@router.post("/users", response_model=AdminUserResponse)
async def create_user(
    payload: AdminUserCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AdminUserService = Depends(get_admin_user_service)
):
    """
    Register/create a new user account profile in the system.
    """
    user = await service.create_user(payload.model_dump())
    dto = AdminUserDTO(**user)
    return AdminUserResponse(
        success=True,
        message="User account created successfully.",
        data=dto
    )

@router.get("/users", response_model=AdminUserListResponse)
async def get_users(
    role_id: Optional[int] = None,
    search: Optional[str] = None,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AdminUserService = Depends(get_admin_user_service)
):
    """
    Retrieve and filter user accounts registered in the system.
    """
    data = await service.filter_users(role_id, search)
    dtos = [AdminUserDTO(**item) for item in data]
    return AdminUserListResponse(
        success=True,
        message="User records retrieved successfully.",
        data=dtos
    )

@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AdminUserService = Depends(get_admin_user_service)
):
    """
    Update profile details, role, or active status of a user.
    """
    user = await service.update_user(user_id, payload.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    dto = AdminUserDTO(**user)
    return AdminUserResponse(
        success=True,
        message="User account updated successfully.",
        data=dto
    )

@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    payload: AdminUserResetPassword,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AdminUserService = Depends(get_admin_user_service)
):
    """
    Force password reset/initialization for a user account.
    """
    success = await service.reset_password(user_id, payload.password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )
    return {
        "success": True,
        "message": "Password initialized/reset successfully."
    }

# Classes CRUD
@router.post("/classes", response_model=ClassResponse)
async def create_class(
    payload: ClassCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.create_class(payload.model_dump())
    return ClassResponse(success=True, message="Class created successfully.", data=ClassDTO(**data))

@router.get("/classes", response_model=ClassListResponse)
async def get_classes(
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.get_classes()
    return ClassListResponse(success=True, message="Classes retrieved successfully.", data=[ClassDTO(**i) for i in data])

@router.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    """
    Retrieve students assigned to a specific class.
    """
    data = await service.get_class_students(class_id)
    return {
        "success": True,
        "message": "Class students retrieved successfully.",
        "data": data
    }

@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    payload: ClassUpdate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.update_class(class_id, payload.model_dump(exclude_unset=True))
    if not data: raise HTTPException(status_code=404, detail="Class not found.")
    return ClassResponse(success=True, message="Class updated successfully.", data=ClassDTO(**data))

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    success = await service.delete_class(class_id)
    if not success: raise HTTPException(status_code=404, detail="Class not found.")
    return {"success": True, "message": "Class deleted successfully."}

# Sections CRUD
@router.post("/sections", response_model=SectionResponse)
async def create_section(
    payload: SectionCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.create_section(payload.model_dump())
    return SectionResponse(success=True, message="Section created successfully.", data=SectionDTO(**data))

@router.get("/sections", response_model=SectionListResponse)
async def get_sections(
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.get_sections()
    return SectionListResponse(success=True, message="Sections retrieved successfully.", data=[SectionDTO(**i) for i in data])

@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: int,
    payload: SectionUpdate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.update_section(section_id, payload.model_dump(exclude_unset=True))
    if not data: raise HTTPException(status_code=404, detail="Section not found.")
    return SectionResponse(success=True, message="Section updated successfully.", data=SectionDTO(**data))

@router.delete("/sections/{section_id}")
async def delete_section(
    section_id: int,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    success = await service.delete_section(section_id)
    if not success: raise HTTPException(status_code=404, detail="Section not found.")
    return {"success": True, "message": "Section deleted successfully."}

# Subjects CRUD
@router.post("/subjects", response_model=SubjectResponse)
async def create_subject(
    payload: SubjectCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.create_subject(payload.model_dump())
    return SubjectResponse(success=True, message="Subject created successfully.", data=SubjectDTO(**data))

@router.get("/subjects", response_model=SubjectListResponse)
async def get_subjects(
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.get_subjects()
    return SubjectListResponse(success=True, message="Subjects retrieved successfully.", data=[SubjectDTO(**i) for i in data])

@router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.update_subject(subject_id, payload.model_dump(exclude_unset=True))
    if not data: raise HTTPException(status_code=404, detail="Subject not found.")
    return SubjectResponse(success=True, message="Subject updated successfully.", data=SubjectDTO(**data))

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: int,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    success = await service.delete_subject(subject_id)
    if not success: raise HTTPException(status_code=404, detail="Subject not found.")
    return {"success": True, "message": "Subject deleted successfully."}

# Academic Years CRUD
@router.post("/academic-years", response_model=AcademicYearResponse)
async def create_academic_year(
    payload: AcademicYearCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.create_academic_year(payload.model_dump())
    return AcademicYearResponse(success=True, message="Academic Year created successfully.", data=AcademicYearDTO(**data))

@router.get("/academic-years", response_model=AcademicYearListResponse)
async def get_academic_years(
    current_admin: UserDTO = Depends(get_current_admin),
    service: AcademicService = Depends(get_academic_service)
):
    data = await service.get_academic_years()
    return AcademicYearListResponse(success=True, message="Academic Years retrieved successfully.", data=[AcademicYearDTO(**i) for i in data])

# Teacher Assignments
@router.post("/teachers/assign", response_model=TeacherAssignmentResponse)
async def assign_teacher(
    payload: TeacherAssignmentCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: TeacherManagementService = Depends(get_teacher_management_service)
):
    """
    Assign a Teacher to a Class and Subject.
    """
    data = await service.assign_teacher(payload.model_dump())
    return TeacherAssignmentResponse(
        success=True,
        message="Teacher assigned successfully.",
        data=TeacherAssignmentDTO(**data)
    )

@router.get("/teacher-assignments", response_model=TeacherAssignmentListResponse)
async def get_all_teacher_assignments(
    teacher_id: Optional[int] = None,
    current_admin: UserDTO = Depends(get_current_admin),
    service: TeacherManagementService = Depends(get_teacher_management_service)
):
    """
    Retrieve all Class and Subject mappings assigned to teachers.
    """
    data = await service.get_teacher_assignments(teacher_id)
    return TeacherAssignmentListResponse(
        success=True,
        message="Teacher assignments retrieved successfully.",
        data=[TeacherAssignmentDTO(**item) for item in data]
    )

@router.get("/teachers/{teacher_id}/assignments", response_model=TeacherAssignmentListResponse)
async def get_teacher_assignments(
    teacher_id: int,
    current_admin: UserDTO = Depends(get_current_admin),
    service: TeacherManagementService = Depends(get_teacher_management_service)
):
    """
    Retrieve all Class and Subject mappings assigned to a Teacher.
    """
    data = await service.get_teacher_assignments(teacher_id)
    return TeacherAssignmentListResponse(
        success=True,
        message="Teacher assignments retrieved successfully.",
        data=[TeacherAssignmentDTO(**item) for item in data]
    )

# Student Management
@router.post("/students/map-class")
@router.post("/map-student")
async def map_student_class(
    payload: StudentClassMapRequest,
    current_admin: UserDTO = Depends(get_current_admin),
    service: StudentManagementService = Depends(get_student_management_service)
):
    """
    Link or assign a Student profile to a Class.
    """
    success = await service.map_student_class(payload.student_id, payload.class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    return {"success": True, "message": "Student mapped to Class successfully."}

@router.post("/students/link-parent", response_model=ParentLinkResponse)
@router.post("/link-parent", response_model=ParentLinkResponse)
async def link_parent(
    payload: ParentLinkRequest,
    current_admin: UserDTO = Depends(get_current_admin),
    service: StudentManagementService = Depends(get_student_management_service)
):
    """
    Link a Parent to a Student profile.
    """
    data = await service.link_parent(payload.student_id, payload.parent_id)
    return ParentLinkResponse(
        success=True,
        message="Parent linked to student successfully.",
        data=ParentLinkDTO(**data)
    )

@router.post("/students/promote", response_model=StudentPromotionResponse)
@router.post("/promote-students", response_model=StudentPromotionResponse)
async def promote_students(
    payload: StudentPromotionRequest,
    current_admin: UserDTO = Depends(get_current_admin),
    service: StudentManagementService = Depends(get_student_management_service)
):
    """
    Promote selected Student profiles to a new target Class.
    """
    count = await service.promote_students(payload.student_ids, payload.target_class_id)
    return StudentPromotionResponse(
        success=True,
        message="Students promoted successfully.",
        data=StudentPromotionDTO(promoted_count=count, target_class_id=payload.target_class_id)
    )

# School Timetable configuration
@router.post("/timetable", response_model=TimetableSlotResponse)
async def create_timetable_slot(
    payload: TimetableSlotCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Configure a new scheduled class timetable slot.
    """
    data = await service.create_timetable_slot(payload.model_dump())
    return TimetableSlotResponse(
        success=True,
        message="Timetable slot created successfully.",
        data=TimetableSlotDTO(**data)
    )

@router.post("/timetable/publish", response_model=TimetableSlotListResponse)
async def publish_timetable(
    payload: TimetablePublishRequest,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Validate conflicts and publish complete class timetable.
    """
    try:
        data = await service.publish_timetable(payload.model_dump())
        return TimetableSlotListResponse(
            success=True,
            message="Timetable published successfully.",
            data=[TimetableSlotDTO(**item) for item in data]
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

@router.get("/timetable/teachers", response_model=TeacherAvailabilityListResponse)
async def get_available_teachers(
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Retrieve available teachers with assigned subjects and classes for timetable assignment.
    """
    data = await service.get_available_teachers()
    return TeacherAvailabilityListResponse(
        success=True,
        message="Available teachers retrieved successfully.",
        data=[TeacherAvailabilityDTO(**item) for item in data]
    )

@router.get("/timetable", response_model=TimetableSlotListResponse)
async def get_timetable_slots(
    class_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Retrieve configured class timetable slots.
    """
    data = await service.get_timetable_slots(class_id=class_id, teacher_id=teacher_id)
    return TimetableSlotListResponse(
        success=True,
        message="Timetable slots retrieved successfully.",
        data=[TimetableSlotDTO(**item) for item in data]
    )

@router.post("/timetable/analyze", response_model=TimetableAnalyzeResponse)
async def analyze_timetable(
    payload: TimetableAnalyzeRequest,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    AI: Generate insights and check for balance/conflicts on the weekly timetable.
    """
    try:
        data = await service.analyze_timetable(payload.model_dump())
        return TimetableAnalyzeResponse(
            success=True,
            message="AI timetable analysis compiled successfully.",
            data=data
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
class TimetableGeneratePayload(BaseModel):
    class_id: int
    selected_teacher_ids: Optional[List[int]] = None

@router.post("/timetable/generate")
@router.post("/ai-timetable/generate")
async def generate_ai_timetable(
    payload: TimetableGeneratePayload,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    AI: Automatically generate and publish a conflict-free weekly timetable schedule using Groq AI.
    """
    data = await service.generate_ai_timetable(payload.class_id, payload.selected_teacher_ids)
    return {
        "success": True,
        "message": "Conflict-free weekly timetable generated and published by Groq AI Engine.",
        "data": data
    }


# School Calendar configuration
@router.post("/calendar", response_model=CalendarEventResponse)
@router.post("/calendar-events", response_model=CalendarEventResponse)
async def create_calendar_event(
    payload: CalendarEventCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Schedule a school academic calendar event.
    """
    data = await service.create_calendar_event(payload.model_dump())
    return CalendarEventResponse(
        success=True,
        message="Calendar event scheduled successfully.",
        data=CalendarEventDTO(**data)
    )

@router.get("/calendar", response_model=CalendarEventListResponse)
@router.get("/calendar-events", response_model=CalendarEventListResponse)
async def get_calendar_events(
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Retrieve academic calendar event scheduling.
    """
    data = await service.get_calendar_events()
    return CalendarEventListResponse(
        success=True,
        message="Calendar events retrieved successfully.",
        data=[CalendarEventDTO(**item) for item in data]
    )

# School Settings Configuration
@router.post("/settings", response_model=SystemSettingResponse)
async def set_system_setting(
    payload: SystemSettingCreate,
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Configure system settings parameters.
    """
    data = await service.set_system_setting(payload.model_dump())
    return SystemSettingResponse(
        success=True,
        message="System setting updated successfully.",
        data=SystemSettingDTO(**data)
    )

@router.get("/settings", response_model=SystemSettingListResponse)
async def get_system_settings(
    current_admin: UserDTO = Depends(get_current_admin),
    service: ConfigService = Depends(get_config_service)
):
    """
    Retrieve global system settings configuration mappings.
    """
    data = await service.get_system_settings()
    return SystemSettingListResponse(
        success=True,
        message="System settings retrieved successfully.",
        data=[SystemSettingDTO(**item) for item in data]
    )

# Admin Dashboard Analytics
@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    current_admin: UserDTO = Depends(get_current_admin),
    service: AdminDashboardService = Depends(get_admin_dashboard_service)
):
    """
    Retrieve system metrics summary for the Admin dashboard home view.
    """
    data = await service.get_dashboard_summary()
    return AdminDashboardResponse(
        success=True,
        message="Admin dashboard summary metrics retrieved successfully.",
        data=AdminDashboardDTO(**data)
    )
