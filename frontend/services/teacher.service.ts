import { api } from "@/lib/api";
import type {
  TeacherDashboardResponse,
  ClassroomHealthResponse,
  LearningDNAResponse,
  RiskAlertsListResponse,
  SharedGoalCreate,
  SharedGoalUpdate,
  SharedGoalResponse,
  SharedGoalListResponse,
  AssignmentCreate,
  AssignmentUpdate,
  AssignmentResponse,
  AssignmentListResponse,
  TeacherStudentListResponse,
  StudentDetailReportResponse,
  SubmissionReviewListResponse,
  SubmissionGrade,
  SubmissionResponse,
  LearningResourceCreate,
  LearningResourceResponse,
  TeacherTimetableResponse,
} from "@/types/teacher.types";

export const teacherService = {
  getProfile: () =>
    api.get<{ success: boolean; data: any }>("/teacher/profile"),

  updateProfile: (data: { first_name?: string; last_name?: string; bio?: string; department?: string }) =>
    api.put<{ success: boolean; data: any }>("/teacher/profile", data),

  getDashboard: () =>
    api.get<TeacherDashboardResponse>("/teacher/dashboard"),

  getClassroomHealth: (classId: number) =>
    api.get<ClassroomHealthResponse>(`/teacher/classes/${classId}/health`),

  getLearningDNA: (studentId: number) =>
    api.get<LearningDNAResponse>(`/teacher/students/${studentId}/learning-dna`),

  getRiskAlerts: (classId: number) =>
    api.get<RiskAlertsListResponse>(`/teacher/classes/${classId}/risk-alerts`),

  getAssignedStudents: () =>
    api.get<TeacherStudentListResponse>("/teacher/students"),

  getStudentDetails: (studentId: number) =>
    api.get<StudentDetailReportResponse>(`/teacher/students/${studentId}/details`),

  getSubmissions: (assignmentId?: number, classId?: number) => {
    const params = new URLSearchParams();
    if (assignmentId) params.append("assignment_id", assignmentId.toString());
    if (classId) params.append("class_id", classId.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return api.get<SubmissionReviewListResponse>(`/teacher/submissions${query}`);
  },

  gradeSubmission: (submissionId: number, data: SubmissionGrade) =>
    api.put<SubmissionResponse>(`/teacher/submissions/${submissionId}/grade`, data),

  createSharedGoal: (data: SharedGoalCreate) =>
    api.post<SharedGoalResponse>("/teacher/shared-goals", data),

  getSharedGoalsForStudent: (studentId: number) =>
    api.get<SharedGoalListResponse>(`/teacher/shared-goals/student/${studentId}`),

  updateSharedGoal: (goalId: number, data: SharedGoalUpdate) =>
    api.put<SharedGoalResponse>(`/teacher/shared-goals/${goalId}`, data),

  createAssignment: (data: AssignmentCreate) =>
    api.post<AssignmentResponse>("/teacher/assignments", data),

  getAssignments: () =>
    api.get<AssignmentListResponse>("/teacher/assignments"),

  updateAssignment: (assignmentId: number, data: AssignmentUpdate) =>
    api.put<AssignmentResponse>(`/teacher/assignments/${assignmentId}`, data),

  deleteAssignment: (assignmentId: number) =>
    api.delete<{ success: boolean; message: string }>(`/teacher/assignments/${assignmentId}`),

  createResource: (data: LearningResourceCreate) =>
    api.post<LearningResourceResponse>("/teacher/resources", data),

  // Timetable
  getTimetable: () => api.get<TeacherTimetableResponse>("/teachers/timetable"),
};
