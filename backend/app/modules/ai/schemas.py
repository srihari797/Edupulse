"""
schemas.py — AI Module Pydantic Schemas

Defines all request and response models for the 5 AI endpoints specified
in docs/06_API_Contract_ai_and_others.md:

  POST /ai/workload-analysis    — AI-01 Workload Intelligence
  POST /ai/learning-health      — AI-03 Learning Health Index
  POST /ai/student-risk         — AI-04 Invisible Student Radar
  POST /ai/growth-passport      — AI-02 Holistic Growth Passport
  POST /ai/recommendations      — Recommendation Engine

All responses conform to the project-wide APIResponse wrapper:
  { "success": bool, "message": str, "data": <typed payload> }

Architecture rules:
  - Schemas live here only — never inline in router or service.
  - Request schemas validate & document input requirements.
  - Response data schemas carry typed AI output + metadata.
  - recommendation_types uses Literal to enforce the API contract subtypes.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

# Re-use the project-wide APIResponse wrapper
from app.modules.student.schemas import APIResponse


# ===========================================================================
# Shared AI Response Data Payload
# Every AI endpoint wraps its output in this structure.
# ===========================================================================

class AIResponseData(BaseModel):
    """Typed data payload returned inside every AI endpoint APIResponse."""

    interaction_id: str = Field(
        ...,
        description="Unique ID of this AI interaction (for history retrieval)."
    )
    template_key: str = Field(
        ...,
        description="The prompt template used (e.g. 'workload_analysis')."
    )
    engine_name: str = Field(
        ...,
        description="The AI engine that produced this response."
    )
    provider_name: str = Field(
        ...,
        description="AI provider used: 'gemini' or 'mock'."
    )
    response: str = Field(
        ...,
        description="Full AI-generated analysis text (markdown formatted)."
    )
    tokens_used: int = Field(
        default=0,
        description="Estimated tokens consumed (0 for mock responses)."
    )
    generated_at: str = Field(
        ...,
        description="ISO 8601 UTC timestamp of when the response was generated."
    )


class AIAnalysisResponse(APIResponse):
    """Standard response wrapper for all AI analysis endpoints."""
    data: AIResponseData


# ===========================================================================
# AI-01 — Workload Analysis  (POST /ai/workload-analysis)
# ===========================================================================

class WorkloadAnalysisRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/workload-analysis.

    Accessible by: Student (role_id=1), Teacher (role_id=3)
    """
    student_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Full name of the student being analysed."
    )
    grade: str = Field(
        ..., min_length=1, max_length=20,
        description="Student grade/class (e.g. 'Grade 10')."
    )
    section: str = Field(
        default="A", max_length=10,
        description="Class section (e.g. 'A')."
    )
    assignments_summary: str = Field(
        ..., min_length=1,
        description="Summary of pending assignments with subjects and due dates."
    )
    deadlines_summary: str = Field(
        ..., min_length=1,
        description="Upcoming deadline list by day."
    )
    attendance_percent: float = Field(
        ..., ge=0.0, le=100.0,
        description="Current week attendance percentage (0-100)."
    )


# ===========================================================================
# AI-03 — Learning Health  (POST /ai/learning-health)
# ===========================================================================

class LearningHealthRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/learning-health.

    Accessible by: Student (role_id=1), Teacher (role_id=3)
    """
    student_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Full name of the student."
    )
    grade: str = Field(
        ..., min_length=1, max_length=20,
        description="Student grade/class."
    )
    assessment_scores: str = Field(
        ..., min_length=1,
        description="Recent assessment scores by subject (formatted text)."
    )
    topics_assessed: str = Field(
        ..., min_length=1,
        description="List of topics assessed in recent tests."
    )
    previous_score: float = Field(
        default=0.0, ge=0.0, le=100.0,
        description="Previous Learning Health Score for trend comparison."
    )
    attendance_percent: float = Field(
        ..., ge=0.0, le=100.0,
        description="Current attendance percentage (0-100)."
    )


# ===========================================================================
# AI-04 — Student Risk  (POST /ai/student-risk)
# ===========================================================================

class StudentRiskRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/student-risk.

    Accessible by: Teacher (role_id=3) only — contains class-wide data.
    """
    class_name: str = Field(
        ..., min_length=1, max_length=50,
        description="Class identifier (e.g. 'Grade 10-A')."
    )
    teacher_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Name of the requesting teacher."
    )
    subject: str = Field(
        ..., min_length=1, max_length=100,
        description="Subject being analysed."
    )
    students_data: str = Field(
        ..., min_length=1,
        description="Summary of student performance data for the class."
    )
    attendance_trends: str = Field(
        ..., min_length=1,
        description="Attendance trend data for the last 30 days."
    )
    grade_trends: str = Field(
        ..., min_length=1,
        description="Grade trend data from the last 3 assessments."
    )
    submission_patterns: str = Field(
        ..., min_length=1,
        description="Assignment submission patterns (late, missing counts)."
    )


# ===========================================================================
# AI-02 — Growth Passport  (POST /ai/growth-passport)
# ===========================================================================

class GrowthPassportRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/growth-passport.

    Accessible by: Student (role_id=1), Teacher (role_id=3), Parent (role_id=2)
    """
    student_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Full name of the student."
    )
    grade: str = Field(
        ..., min_length=1, max_length=20,
        description="Student grade/class."
    )
    academic_year: str = Field(
        default="2025-2026", max_length=20,
        description="Academic year being evaluated (e.g. '2025-2026')."
    )
    academic_summary: str = Field(
        ..., min_length=1,
        description="Summary of academic performance for the year."
    )
    extracurricular_achievements: str = Field(
        ..., min_length=1,
        description="Extracurricular achievements and activities."
    )
    attendance_percent: float = Field(
        ..., ge=0.0, le=100.0,
        description="Overall attendance percentage."
    )
    punctuality_score: float = Field(
        default=100.0, ge=0.0, le=100.0,
        description="Punctuality score percentage."
    )
    participation_data: str = Field(
        default="No participation data provided.",
        description="Behavioural and participation indicators."
    )
    milestones: str = Field(
        ..., min_length=1,
        description="Key academic and extracurricular milestones this year."
    )


# ===========================================================================
# Recommendation Engine  (POST /ai/recommendations)
# ===========================================================================

RecommendationType = Literal[
    "study_plan",
    "exam_plan",
    "opportunities",
    "parent_guidance",
    "teacher_guidance",
]

class RecommendationsRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/recommendations.

    Accessible by: Student (1), Parent (2), Teacher (3)
    Subtypes align to 06_API_Contract_ai_and_others.md recommendation types.
    """
    student_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Full name of the student."
    )
    grade: str = Field(
        ..., min_length=1, max_length=20,
        description="Student grade/class."
    )
    role: str = Field(
        default="Student",
        description="Role of the requesting user (Student / Parent / Teacher)."
    )
    recommendation_types: List[RecommendationType] = Field(
        default=["study_plan", "exam_plan"],
        description=(
            "List of recommendation types to generate. "
            "Options: study_plan, exam_plan, opportunities, parent_guidance, teacher_guidance."
        ),
        min_length=1,
    )
    academic_summary: str = Field(
        ..., min_length=1,
        description="Summary of current academic performance."
    )
    weak_areas: str = Field(
        ..., min_length=1,
        description="Subjects or topics where the student needs improvement."
    )
    strong_areas: str = Field(
        ..., min_length=1,
        description="Subjects or topics where the student excels."
    )
    upcoming_events: str = Field(
        default="No upcoming events specified.",
        description="Upcoming exams, deadlines, or school events."
    )
    interests: str = Field(
        default="Not specified.",
        description="Student interests, hobbies, and extracurricular activities."
    )


# ===========================================================================
# AI Interaction History
# ===========================================================================

class AIInteractionDTO(BaseModel):
    """Serialised representation of a stored AI interaction."""
    id: str
    user_id: int
    template_key: str
    engine_name: str
    provider_name: str
    request_summary: str
    response_text: str
    tokens_used: int
    created_at: str

    class Config:
        from_attributes = True


class AIInteractionListResponse(APIResponse):
    """Response wrapper for AI interaction history listings."""
    data: List[AIInteractionDTO]


class AIInteractionResponse(APIResponse):
    """Response wrapper for a single AI interaction lookup."""
    data: AIInteractionDTO
