/**
 * ai.service.ts — AI module API calls.
 * Paths match backend modules/ai/router.py exactly.
 */

import { api } from "@/lib/api";
import type {
  AIAnalysisResponse,
  WorkloadAnalysisRequest,
  LearningHealthRequest,
  StudentRiskRequest,
  GrowthPassportRequest,
  RecommendationsRequest,
} from "@/types/ai.types";

export const aiService = {
  /** AI-01: Workload analysis — roles: Student(1), Teacher(3), Admin(4) */
  analyzeWorkload: (data: WorkloadAnalysisRequest) =>
    api.post<AIAnalysisResponse>("/ai/workload-analysis", data),

  /** AI-03: Learning health — roles: Student(1), Teacher(3), Admin(4) */
  analyzeLearningHealth: (data: LearningHealthRequest) =>
    api.post<AIAnalysisResponse>("/ai/learning-health", data),

  /** AI-04: Student risk radar — roles: Teacher(3), Admin(4) */
  analyzeStudentRisk: (data: StudentRiskRequest) =>
    api.post<AIAnalysisResponse>("/ai/student-risk", data),

  /** AI-02: Growth passport — roles: All (1,2,3,4) */
  generateGrowthPassport: (data: GrowthPassportRequest) =>
    api.post<AIAnalysisResponse>("/ai/growth-passport", data),

  /** Personalized recommendations — roles: All (1,2,3,4) */
  generateRecommendations: (data: RecommendationsRequest) =>
    api.post<AIAnalysisResponse>("/ai/recommendations", data),

  /** Teacher analytics dashboard — roles: Teacher(3), Admin(4) */
  getTeacherAnalytics: (classId: number) =>
    api.get<AIAnalysisResponse>("/ai/teachers/analytics", { class_id: classId }),

  /** Admin student radar — role: Admin(4) only */
  getStudentRadar: (classId: number) =>
    api.get<AIAnalysisResponse>("/ai/students/radar", { class_id: classId }),
};
