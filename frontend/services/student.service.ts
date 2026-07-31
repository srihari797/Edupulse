/**
 * student.service.ts — Student module API calls.
 * All paths are frozen — matches backend modules/student/router.py exactly.
 */

import { api } from "@/lib/api";
import type {
  StudentProfileResponse,
  StudentProfileUpdate,
  StudentDashboardResponse,
  StudyPlanResponse,
  OpportunityListResponse,
  DoubtCreate,
  DoubtResponse,
  DoubtListResponse,
  StudentTimetableListResponse,
} from "@/types/student.types";
import type {
  AssignmentListResponse,
  SubmissionSubmit,
  SubmissionResponse,
  LearningResourceListResponse,
} from "@/types/teacher.types";
import type {
  GrowthPassportResponse,
  RecognitionResponse,
} from "@/types/growth.types";

export const studentService = {
  getProfile: () => api.get<StudentProfileResponse>("/students/profile"),
  updateProfile: (data: StudentProfileUpdate) => api.put<StudentProfileResponse>("/students/profile", data),

  getDashboard: () => api.get<StudentDashboardResponse>("/students/dashboard"),

  getStudyPlan: () => api.get<StudyPlanResponse>("/students/study-plan"),
  createStudyPlan: (data: Record<string, unknown>) => api.post<StudyPlanResponse>("/students/study-plan", data),

  getExamPlan: () => api.get<StudyPlanResponse>("/students/exam-plan"),
  createExamPlan: (data: Record<string, unknown>) => api.post<StudyPlanResponse>("/students/exam-plan", data),

  getOpportunities: () => api.get<OpportunityListResponse>("/students/opportunities"),

  getAssignments: () => api.get<AssignmentListResponse>("/students/assignments"),
  submitAssignment: (assignmentId: number, data: SubmissionSubmit) =>
    api.post<SubmissionResponse>(`/students/assignments/${assignmentId}/submit`, data),
  getSubmission: (assignmentId: number) =>
    api.get<SubmissionResponse>(`/students/assignments/${assignmentId}/submission`),

  getResources: () => api.get<LearningResourceListResponse>("/students/resources"),

  createDoubt: (data: DoubtCreate) => api.post<DoubtResponse>("/students/doubts", data),
  getDoubts: () => api.get<DoubtListResponse>("/students/doubts"),

  getGrowthPassport: () => api.get<GrowthPassportResponse>("/students/growth-passport"),
  getRecognition: () => api.get<RecognitionResponse>("/students/recognition"),

  // Timetable
  getTimetable: () => api.get<StudentTimetableListResponse>("/students/timetable"),
};
