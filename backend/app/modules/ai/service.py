"""
service.py — AI Module Service Layer

Orchestrates the full AI request pipeline for all 5 AI endpoints:

  POST /ai/workload-analysis    → analyse_workload()
  POST /ai/learning-health      → analyse_learning_health()
  POST /ai/student-risk         → analyse_student_risk()
  POST /ai/growth-passport      → generate_growth_passport()
  POST /ai/recommendations      → generate_recommendations()

Pipeline per endpoint:
  1. Build context dict from the validated request schema.
  2. Call build_prompt(template_key, context) → PromptPackage.
  3. Call provider.generate_response(prompt, system_instruction) → text.
  4. Persist the interaction via repository.save_interaction().
  5. Return a typed AIResponseData to the router.

Architecture rules (from 09_Coding_Guidelines.md):
  - Business logic ONLY in the Service layer.
  - Service calls repository — never accesses DB directly.
  - Service calls provider through BaseAIProvider interface only.
  - Router calls service — never accesses provider or repository directly.
"""

from datetime import datetime, timezone
from typing import Optional

from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.repository import AIRepository
from app.modules.ai.prompts.engine import build_prompt, PromptValidationError
from app.modules.ai.schemas import (
    AIResponseData,
    WorkloadAnalysisRequest,
    LearningHealthRequest,
    StudentRiskRequest,
    GrowthPassportRequest,
    RecommendationsRequest,
)


class AIService:
    """
    AI Service Layer — central orchestrator for all AI features.

    Injected via FastAPI Depends() with:
      - provider: the ADSA-resolved BaseAIProvider (Gemini or Mock)
      - repository: the ADSA-resolved AIRepository (Real or Mock)

    The service knows nothing about which concrete provider or repository
    it is using — it only speaks to their shared interfaces.
    """

    def __init__(
        self,
        provider: BaseAIProvider,
        repository: AIRepository,
    ):
        self.provider   = provider
        self.repository = repository

    # ------------------------------------------------------------------
    # Internal helper — shared pipeline core
    # ------------------------------------------------------------------

    async def _run_ai_pipeline(
        self,
        template_key: str,
        context: dict,
        user_id: int,
        request_summary: str,
    ) -> AIResponseData:
        """
        Shared pipeline for all AI endpoints:
          build_prompt → generate_response → save_interaction → AIResponseData

        Args:
            template_key:     Prompt template key string.
            context:          Populated context dict for the template.
            user_id:          Authenticated user ID for interaction tracking.
            request_summary:  Short human-readable summary for history display.

        Returns:
            AIResponseData — typed response payload for the router.
        """
        # Step 1: Build and validate the prompt
        package = build_prompt(template_key, context)

        # Step 2: Dispatch to AI provider
        response_text = await self.provider.generate_response(
            prompt=package.user_prompt,
            system_instruction=package.system_instruction,
        )

        # Step 3: Persist interaction
        interaction = await self.repository.save_interaction(
            user_id=user_id,
            template_key=package.template_key,
            engine_name=package.engine_name,
            provider_name=self.provider.provider_name(),
            request_summary=request_summary,
            response_text=response_text,
            tokens_used=0,  # Token tracking: placeholder for Gemini usage metadata
        )

        # Step 4: Return typed response data
        return AIResponseData(
            interaction_id=interaction.id,
            template_key=package.template_key,
            engine_name=package.engine_name,
            provider_name=self.provider.provider_name(),
            response=response_text,
            tokens_used=interaction.tokens_used,
            generated_at=interaction.created_at.isoformat(),
        )

    # ------------------------------------------------------------------
    # AI-01: Workload Intelligence Engine
    # POST /api/v1/ai/workload-analysis
    # ------------------------------------------------------------------

    async def analyse_workload(
        self,
        request: WorkloadAnalysisRequest,
        user_id: int,
    ) -> AIResponseData:
        """
        Generate workload analysis for a student's pending assignments.
        Consumers: Student (study planner), Teacher (assignment dashboard).
        """
        context = {
            "student_name":       request.student_name,
            "grade":              request.grade,
            "section":            request.section,
            "assignments_summary": request.assignments_summary,
            "deadlines_summary":  request.deadlines_summary,
            "attendance_percent": request.attendance_percent,
        }
        return await self._run_ai_pipeline(
            template_key="workload_analysis",
            context=context,
            user_id=user_id,
            request_summary=(
                f"Student: {request.student_name} | Grade: {request.grade} | "
                f"Attendance: {request.attendance_percent}%"
            ),
        )

    # ------------------------------------------------------------------
    # AI-03: Learning Health Engine
    # POST /api/v1/ai/learning-health
    # ------------------------------------------------------------------

    async def analyse_learning_health(
        self,
        request: LearningHealthRequest,
        user_id: int,
    ) -> AIResponseData:
        """
        Generate Learning Health Index with concept mastery breakdown.
        Consumers: Student (weakness analyser), Teacher (classroom health).
        """
        context = {
            "student_name":     request.student_name,
            "grade":            request.grade,
            "assessment_scores": request.assessment_scores,
            "topics_assessed":  request.topics_assessed,
            "previous_score":   request.previous_score,
            "attendance_percent": request.attendance_percent,
        }
        return await self._run_ai_pipeline(
            template_key="learning_health",
            context=context,
            user_id=user_id,
            request_summary=(
                f"Student: {request.student_name} | Grade: {request.grade} | "
                f"Previous Score: {request.previous_score}"
            ),
        )

    # ------------------------------------------------------------------
    # AI-04: Invisible Student Radar Engine
    # POST /api/v1/ai/student-risk
    # ------------------------------------------------------------------

    async def analyse_student_risk(
        self,
        request: StudentRiskRequest,
        user_id: int,
    ) -> AIResponseData:
        """
        Detect at-risk students across a teacher's class.
        Consumer: Teacher only (class-wide data).
        """
        context = {
            "class_name":          request.class_name,
            "teacher_name":        request.teacher_name,
            "subject":             request.subject,
            "students_data":       request.students_data,
            "attendance_trends":   request.attendance_trends,
            "grade_trends":        request.grade_trends,
            "submission_patterns": request.submission_patterns,
        }
        return await self._run_ai_pipeline(
            template_key="student_risk",
            context=context,
            user_id=user_id,
            request_summary=(
                f"Class: {request.class_name} | Subject: {request.subject} | "
                f"Teacher: {request.teacher_name}"
            ),
        )

    # ------------------------------------------------------------------
    # AI-02: Holistic Growth Passport Engine
    # POST /api/v1/ai/growth-passport
    # ------------------------------------------------------------------

    async def generate_growth_passport(
        self,
        request: GrowthPassportRequest,
        user_id: int,
    ) -> AIResponseData:
        """
        Generate a holistic student growth passport report.
        Consumers: Student, Teacher, Parent.
        """
        context = {
            "student_name":                request.student_name,
            "grade":                       request.grade,
            "academic_year":               request.academic_year,
            "academic_summary":            request.academic_summary,
            "extracurricular_achievements": request.extracurricular_achievements,
            "attendance_percent":          request.attendance_percent,
            "punctuality_score":           request.punctuality_score,
            "participation_data":          request.participation_data,
            "milestones":                  request.milestones,
        }
        return await self._run_ai_pipeline(
            template_key="growth_passport",
            context=context,
            user_id=user_id,
            request_summary=(
                f"Student: {request.student_name} | Grade: {request.grade} | "
                f"Year: {request.academic_year}"
            ),
        )

    # ------------------------------------------------------------------
    # Recommendation Engine
    # POST /api/v1/ai/recommendations
    # ------------------------------------------------------------------

    async def generate_recommendations(
        self,
        request: RecommendationsRequest,
        user_id: int,
    ) -> AIResponseData:
        """
        Generate personalised multi-type recommendations.
        Consumers: Student, Parent, Teacher.
        Subtypes: study_plan, exam_plan, opportunities, parent_guidance, teacher_guidance.
        """
        context = {
            "student_name":         request.student_name,
            "grade":                request.grade,
            "role":                 request.role,
            "recommendation_types": ", ".join(request.recommendation_types),
            "academic_summary":     request.academic_summary,
            "weak_areas":           request.weak_areas,
            "strong_areas":         request.strong_areas,
            "upcoming_events":      request.upcoming_events,
            "interests":            request.interests,
        }
        return await self._run_ai_pipeline(
            template_key="recommendations",
            context=context,
            user_id=user_id,
            request_summary=(
                f"Student: {request.student_name} | Grade: {request.grade} | "
                f"Types: {', '.join(request.recommendation_types)}"
            ),
        )

    # ------------------------------------------------------------------
    # Interaction History
    # ------------------------------------------------------------------

    async def get_user_interactions(
        self,
        user_id: int,
        template_key: Optional[str] = None,
        limit: int = 10,
    ) -> list:
        """
        Retrieve a user's AI interaction history.

        Args:
            user_id:      Authenticated user ID.
            template_key: Optional filter by AI engine type.
            limit:        Maximum records to return (default 10).

        Returns:
            List of AIInteraction objects from the repository.
        """
        return await self.repository.get_user_interactions(
            user_id=user_id,
            template_key=template_key,
            limit=limit,
        )
