/**
 * ai.types.ts — AI module type definitions.
 * 1-to-1 mirror of backend modules/ai/schemas.py
 */
import { APIResponse } from "./common.types";

/** All AI endpoints return this response shape */
export interface AIAnalysisData {
  analysis: string;
  [key: string]: unknown; // May include additional fields depending on endpoint
}

export type AIAnalysisResponse = APIResponse<AIAnalysisData>;

/** POST /api/v1/ai/workload-analysis */
export interface WorkloadAnalysisRequest {
  student_name: string;
  grade: string;
  assignments_data: string;
  upcoming_exams: string;
  study_hours_per_day: number;
}

/** POST /api/v1/ai/learning-health */
export interface LearningHealthRequest {
  student_name: string;
  grade: string;
  assessment_scores: string;
  topics_assessed: string;
  previous_score: number;
  attendance_percent: number;
}

/** POST /api/v1/ai/student-risk — Teacher/Admin only */
export interface StudentRiskRequest {
  class_name: string;
  teacher_name: string;
  subject: string;
  students_data: string;
  attendance_trends: string;
  grade_trends: string;
  submission_patterns: string;
}

/** POST /api/v1/ai/growth-passport */
export interface GrowthPassportRequest {
  student_name: string;
  grade: string;
  achievements: string;
  [key: string]: unknown;
}

/** POST /api/v1/ai/recommendations */
export interface RecommendationsRequest {
  student_name: string;
  grade: string;
  context: string;
  [key: string]: unknown;
}
