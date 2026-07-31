"""
router.py — AI Module Router

FastAPI APIRouter for the 5 core AI endpoints defined in docs/06_API_Contract_ai_and_others.md.
Includes JWT authentication, role-based authorization dependencies, and standard APIResponse mapping.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.auth.router import get_current_user
from app.auth.schemas import UserDTO
from app.modules.ai.resolver import get_ai_provider, get_ai_repository
from app.modules.ai.service import AIService
from app.modules.ai.schemas import (
    AIAnalysisResponse,
    WorkloadAnalysisRequest,
    LearningHealthRequest,
    StudentRiskRequest,
    GrowthPassportRequest,
    RecommendationsRequest,
)

router = APIRouter(prefix="/ai", tags=["ai"])

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

def get_ai_service(
    db: AsyncSession = Depends(get_db),
    provider = Depends(get_ai_provider)
) -> AIService:
    """Resolves and constructs the AIService instance."""
    repository = get_ai_repository(db)
    return AIService(provider=provider, repository=repository)


def require_roles(allowed_roles: List[int]):
    """
    Role verification dependency.
    Allowed Roles:
      1 - Student
      2 - Parent
      3 - Teacher
      4 - Admin
    """
    def role_dependency(current_user: UserDTO = Depends(get_current_user)) -> UserDTO:
        if current_user.role_id not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: User role is not authorized to access this endpoint."
            )
        return current_user
    return role_dependency


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@router.post("/workload-analysis", response_model=AIAnalysisResponse)
async def analyze_workload(
    payload: WorkloadAnalysisRequest,
    current_user: UserDTO = Depends(require_roles([1, 3, 4])),
    service: AIService = Depends(get_ai_service)
):
    """
    AI-01: Generate workload analysis for a student's pending assignments.
    Authorized roles: Student (1), Teacher (3), Admin (4)
    """
    data = await service.analyse_workload(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="AI workload analysis compiled successfully.",
        data=data
    )


@router.post("/learning-health", response_model=AIAnalysisResponse)
async def analyze_learning_health(
    payload: LearningHealthRequest,
    current_user: UserDTO = Depends(require_roles([1, 3, 4])),
    service: AIService = Depends(get_ai_service)
):
    """
    AI-03: Generate learning health concepts index.
    Authorized roles: Student (1), Teacher (3), Admin (4)
    """
    data = await service.analyse_learning_health(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="AI learning health insights compiled successfully.",
        data=data
    )


@router.post("/student-risk", response_model=AIAnalysisResponse)
async def analyze_student_risk(
    payload: StudentRiskRequest,
    current_user: UserDTO = Depends(require_roles([3, 4])),
    service: AIService = Depends(get_ai_service)
):
    """
    AI-04: Detect disengagement risk signals and generate attention predictions.
    Authorized roles: Teacher (3), Admin (4)
    """
    data = await service.analyse_student_risk(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="AI student risk radar analysis compiled successfully.",
        data=data
    )


@router.post("/growth-passport", response_model=AIAnalysisResponse)
async def generate_growth_passport(
    payload: GrowthPassportRequest,
    current_user: UserDTO = Depends(require_roles([1, 2, 3, 4])),
    service: AIService = Depends(get_ai_service)
):
    """
    AI-02: Generate holistic growth passport scoring and timeline narrative.
    Authorized roles: Student (1), Parent (2), Teacher (3), Admin (4)
    """
    data = await service.generate_growth_passport(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="AI student holistic growth passport compiled successfully.",
        data=data
    )


@router.post("/recommendations", response_model=AIAnalysisResponse)
async def generate_recommendations(
    payload: RecommendationsRequest,
    current_user: UserDTO = Depends(require_roles([1, 2, 3, 4])),
    service: AIService = Depends(get_ai_service)
):
    """
    Generate personalized recommendations across study/exam planning and opportunity selection.
    Authorized roles: Student (1), Parent (2), Teacher (3), Admin (4)
    """
    data = await service.generate_recommendations(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="AI personalized recommendations compiled successfully.",
        data=data
    )


@router.get("/teachers/analytics", response_model=AIAnalysisResponse)
async def get_teacher_analytics(
    class_id: int = 10,
    current_user: UserDTO = Depends(require_roles([3, 4])),
    db: AsyncSession = Depends(get_db),
    service: AIService = Depends(get_ai_service)
):
    """
    GET /api/v1/ai/teachers/analytics
    Connects the Teacher analytics module to the AI Learning Health Engine.
    Exposes learning health index insights for the classroom.
    Authorized roles: Teacher (3), Admin (4)
    """
    from app.modules.teacher.resolver import get_teacher_repository
    teacher_repo = get_teacher_repository(db)
    
    classroom_health = await teacher_repo.get_classroom_health(class_id)
    if not classroom_health:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom health data not found."
        )
        
    payload = LearningHealthRequest(
        student_name=f"Classroom {classroom_health.get('class_name', class_id)}",
        grade=classroom_health.get("class_name", "Grade 10"),
        assessment_scores=f"Average GPA: {classroom_health.get('average_gpa', 0.0)}",
        topics_assessed=", ".join(classroom_health.get("weak_topics", [])),
        previous_score=75.0,
        attendance_percent=classroom_health.get("average_attendance", 100.0)
    )
    data = await service.analyse_learning_health(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="Classroom learning health index compiled successfully.",
        data=data
    )


@router.get("/students/radar", response_model=AIAnalysisResponse)
async def get_student_radar(
    class_id: int = 10,
    current_user: UserDTO = Depends(require_roles([4])),
    db: AsyncSession = Depends(get_db),
    service: AIService = Depends(get_ai_service)
):
    """
    GET /api/v1/ai/students/radar
    Connects the Admin student radar module to the Invisible Student Radar AI Engine.
    Detects students showing early signs of withdrawal or declining performance.
    Authorized roles: Admin (4)
    """
    from app.modules.teacher.resolver import get_teacher_repository
    teacher_repo = get_teacher_repository(db)
    
    alerts = await teacher_repo.get_risk_alerts(class_id)
    students_data = "; ".join([f"{a['student_name']}: {a['reason']} ({a['risk_level']})" for a in alerts])
    if not students_data:
        students_data = "No risk alerts active."
        
    payload = StudentRiskRequest(
        class_name=f"Class {class_id}",
        teacher_name="David Miller",
        subject="All Subjects",
        students_data=students_data,
        attendance_trends="Attendance trends monitored",
        grade_trends="Grade trends monitored",
        submission_patterns="Submission patterns monitored"
    )
    data = await service.analyse_student_risk(payload, current_user.id)
    return AIAnalysisResponse(
        success=True,
        message="Student risk radar analysis compiled successfully.",
        data=data
    )
