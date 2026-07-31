from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.modules.student.resolver import get_student_repository
from app.modules.student.service import StudentService
from app.modules.student.schemas import (
    StudentProfileResponse,
    StudentProfileUpdate,
    StudentProfileDTO,
    StudentDashboardResponse,
    StudentDashboardDTO,
    StudyPlanResponse,
    StudyPlanDTO,
    OpportunityListResponse,
    OpportunityDTO,
    DoubtCreate,
    DoubtDTO,
    DoubtResponse,
    DoubtListResponse,
    StudentTimetableSlotDTO,
    StudentTimetableListResponse
)


from app.modules.teacher.schemas import (
    AssignmentListResponse,
    AssignmentDTO,
    SubmissionSubmit,
    SubmissionDTO,
    SubmissionResponse,
    LearningResourceListResponse,
    LearningResourceResponse,
    LearningResourceDTO
)

from app.auth.router import get_current_user
from app.auth.schemas import UserDTO

router = APIRouter(prefix="/students", tags=["student"])

def get_current_student(
    current_user: UserDTO = Depends(get_current_user)
) -> UserDTO:
    """
    Dependency verifying that the user is authenticated and has the Student role (role_id = 1).
    """
    if current_user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User role is not authorized to access Student endpoints."
        )
    return current_user

def get_student_service(
    db: AsyncSession = Depends(get_db)
) -> StudentService:
    """
    Dependency that resolves the repository and creates the service.
    """
    repository = get_student_repository(db)
    return StudentService(repository)

@router.get("/profile", response_model=StudentProfileResponse)
async def get_profile(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve authenticated student profile.
    """
    profile = await service.get_profile(current_student.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
    
    dto = StudentProfileDTO(**profile)
    return StudentProfileResponse(
        success=True,
        message="Profile retrieved successfully.",
        data=dto
    )

@router.put("/profile", response_model=StudentProfileResponse)
async def update_profile(
    profile_update: StudentProfileUpdate,
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Update details of student profile.
    """
    profile = await service.update_profile(current_student.id, profile_update)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
    
    dto = StudentProfileDTO(**profile)
    return StudentProfileResponse(
        success=True,
        message="Profile updated successfully.",
        data=dto
    )

@router.get("/dashboard", response_model=StudentDashboardResponse)
async def get_dashboard(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve aggregated dashboard statistics for student view.
    """
    dashboard_data = await service.get_dashboard(current_student.id)
    dto = StudentDashboardDTO(**dashboard_data)
    return StudentDashboardResponse(
        success=True,
        message="Dashboard statistics retrieved successfully.",
        data=dto
    )

@router.get("/learning-health")
async def get_student_learning_health(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve database-calculated Learning Health Index (LHI) statistics.
    """
    data = await service.get_learning_health(current_student.id)
    return {
        "success": True,
        "message": "Student learning health index retrieved successfully.",
        "data": data
    }

@router.get("/workload-intelligence")
async def get_student_workload_intelligence(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve workload cards, teacher contribution graph breakdown, and overload conflict alerts.
    """
    data = await service.get_workload_intelligence(current_student.id)
    return {
        "success": True,
        "message": "Workload intelligence retrieved successfully.",
        "data": data
    }

@router.post("/study-plan", response_model=StudyPlanResponse)
async def generate_study_plan(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Compile/generate a new AI Study Plan.
    """
    plan = await service.generate_study_plan(current_student.id, "Weekly")
    dto = StudyPlanDTO(**plan)
    return StudyPlanResponse(
        success=True,
        message="Study plan compiled successfully.",
        data=dto
    )

@router.get("/study-plan", response_model=StudyPlanResponse)
async def get_study_plan(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve the latest compiled study plan.
    """
    plan = await service.get_latest_study_plan(current_student.id, "Weekly")
    dto = StudyPlanDTO(**plan)
    return StudyPlanResponse(
        success=True,
        message="Study plan retrieved successfully.",
        data=dto
    )

@router.post("/exam-plan", response_model=StudyPlanResponse)
async def generate_exam_plan(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Compile/generate a new AI Exam Revision Plan.
    """
    plan = await service.generate_study_plan(current_student.id, "Exam Revision")
    dto = StudyPlanDTO(**plan)
    return StudyPlanResponse(
        success=True,
        message="Exam revision plan compiled successfully.",
        data=dto
    )

@router.get("/exam-plan", response_model=StudyPlanResponse)
async def get_exam_plan(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve the latest compiled exam revision plan.
    """
    plan = await service.get_latest_study_plan(current_student.id, "Exam Revision")
    dto = StudyPlanDTO(**plan)
    return StudyPlanResponse(
        success=True,
        message="Exam revision plan retrieved successfully.",
        data=dto
    )

@router.get("/opportunities", response_model=OpportunityListResponse)
async def get_opportunities(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve personalized opportunity recommendations compiled by the AI Engine.
    """
    data = await service.get_opportunities(current_student.id)
    dtos = [OpportunityDTO(**item) for item in data]
    return OpportunityListResponse(
        success=True,
        message="Recommended opportunities retrieved successfully.",
        data=dtos
    )

@router.get("/assignments", response_model=AssignmentListResponse)
async def get_student_assignments(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    List all active assignments assigned to the student's class.
    """
    data = await service.get_student_assignments(current_student.id)
    dtos = [AssignmentDTO(**item) for item in data]
    return AssignmentListResponse(
        success=True,
        message="Assignments retrieved successfully.",
        data=dtos
    )

@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    payload: SubmissionSubmit,
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Submit completed assignment referencing storage metadata.
    Does not receive binary files.
    """
    try:
        data = await service.submit_assignment(
            user_id=current_student.id,
            assignment_id=assignment_id,
            file_bucket=payload.file_bucket,
            file_path=payload.file_path
        )
        dto = SubmissionDTO(**data)
        return SubmissionResponse(
            success=True,
            message="Assignment submitted successfully.",
            data=dto
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )

@router.post("/assignments/{assignment_id}/upload", response_model=SubmissionResponse)
async def upload_and_submit_assignment(
    assignment_id: int,
    file: UploadFile = File(...),
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Automated student submission file upload to Supabase Storage.
    The backend automatically resolves the student, generates the storage path,
    uploads to 'edupulse-submissions', and stores submission metadata in PostgreSQL.
    """
    from app.services.storage import StorageService
    from app.core.config import settings

    profile = await service.get_profile(current_student.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    student_id = profile["id"]
    file_bytes = await file.read()
    storage_svc = StorageService()

    bucket = getattr(settings, "SUPABASE_BUCKET_SUBMISSIONS", "edupulse-submissions") or "edupulse-submissions"
    res_path = storage_svc.get_submission_path(assignment_id, student_id, file.filename)

    upload_res = await storage_svc.upload_file(
        bucket_name=bucket,
        storage_path=res_path,
        file_content=file_bytes,
        original_filename=file.filename,
        mime_type=file.content_type,
        upsert=True
    )

    data = await service.submit_assignment(
        user_id=current_student.id,
        assignment_id=assignment_id,
        file_bucket=bucket,
        file_path=upload_res["storage_path"]
    )

    dto = SubmissionDTO(**data)
    return SubmissionResponse(
        success=True,
        message="Assignment file uploaded to Supabase Storage and submitted successfully.",
        data=dto
    )

@router.get("/assignments/{assignment_id}/submission", response_model=SubmissionResponse)
async def get_student_submission(
    assignment_id: int,
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Check status, score, and grading feedback for a specific submission.
    """
    data = await service.get_student_submission(current_student.id, assignment_id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submission found for this assignment."
        )
    dto = SubmissionDTO(**data)
    return SubmissionResponse(
        success=True,
        message="Submission status retrieved successfully.",
        data=dto
    )

@router.get("/resources")
async def get_student_resources(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve database-driven learning resources joined with subjects and teacher profiles.
    """
    data = await service.get_student_resources(current_student.id)
    return {
        "success": True,
        "message": "Learning resources retrieved successfully.",
        "data": data
    }

@router.get("/resources/{resource_id}/download")
async def download_learning_resource(
    resource_id: int,
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Generate a signed URL or stream binary content for learning resource download from Supabase Storage.
    """
    from app.services.storage import StorageService
    from app.modules.teacher.models import LearningResource
    from sqlalchemy import select

    stmt = select(LearningResource).where(LearningResource.id == resource_id)
    res = await service.repository.db.execute(stmt)
    resource = res.scalar_one_or_none()

    if not resource or not resource.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning resource file path not found."
        )

    storage_svc = StorageService()
    bucket = resource.file_bucket or "edupulse-resources"

    signed_url = await storage_svc.generate_signed_url(
        bucket_name=bucket,
        storage_path=resource.file_path,
        expires_in_seconds=3600
    )

    if signed_url:
        return {"success": True, "download_url": signed_url}
    
    file_bytes = await storage_svc.download_file(bucket_name=bucket, storage_path=resource.file_path)
    from fastapi.responses import Response
    clean_title = resource.title.replace(" ", "_")
    return Response(
        content=file_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{clean_title}.pdf"'}
    )

@router.post("/doubts", response_model=DoubtResponse)
async def submit_doubt(
    payload: DoubtCreate,
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Submit an academic doubt to a designated subject teacher stored in PostgreSQL.
    Automatically sends an in-app notification to the teacher.
    """
    data = await service.create_student_doubt(
        user_id=current_student.id,
        teacher_id=payload.teacher_id,
        subject_id=payload.subject_id,
        title=payload.title,
        query=payload.query
    )
    dto = DoubtDTO(**data)
    return DoubtResponse(
        success=True,
        message="Academic doubt posted successfully. Teacher has been notified.",
        data=dto
    )

@router.get("/doubts", response_model=DoubtListResponse)
async def get_doubts(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve all posted doubts and teacher responses for the authenticated student.
    """
    data = await service.get_student_doubts(current_student.id)
    dtos = [DoubtDTO(**d) for d in data]
    return DoubtListResponse(
        success=True,
        message="Student doubts retrieved successfully.",
        data=dtos
    )

@router.get("/faculty-options")
async def get_faculty_options(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve active class faculty mapping from PostgreSQL for student's assigned class_id.
    """
    data = await service.get_faculty_options(current_student.id)
    return {
        "success": True,
        "message": "Class faculty options retrieved successfully from database.",
        "data": data
    }


@router.get("/timetable", response_model=StudentTimetableListResponse)
async def get_student_timetable(
    current_student: UserDTO = Depends(get_current_student),
    service: StudentService = Depends(get_student_service)
):
    """
    Retrieve class timetable for authenticated student.
    """
    data = await service.get_student_timetable(current_student.id)
    return StudentTimetableListResponse(
        success=True,
        message="Student timetable retrieved successfully.",
        data=[StudentTimetableSlotDTO(**item) for item in data]
    )