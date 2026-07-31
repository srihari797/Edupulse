/**
 * teacher.types.ts — Teacher module type definitions.
 * 1-to-1 mirror of backend modules/teacher/schemas.py
 */
import { APIResponse } from "./common.types";

/** GET /api/v1/teacher/dashboard */
export interface TeacherDashboardDTO {
  classroom_summary: {
    class_name: string;
    student_count: number;
    average_attendance: number;
  };
  workload_overview: {
    active_assignments: number;
    pending_grading: number;
    upcoming_exams: number;
  };
  student_insights: Array<{
    student_name: string;
    insight: string;
  }>;
  risk_alerts: Array<{
    student_name: string;
    risk_level: string;
    reason: string;
  }>;
}

export type TeacherDashboardResponse = APIResponse<TeacherDashboardDTO>;

/** GET /api/v1/teacher/classes/{id}/health */
export interface ClassroomHealthDTO {
  class_id: number;
  class_name: string;
  average_gpa: number;
  average_attendance: number;
  weak_topics: string[];
  performance_distribution: Record<string, unknown>;
}

export type ClassroomHealthResponse = APIResponse<ClassroomHealthDTO>;

/** GET /api/v1/teacher/students/{id}/learning-dna */
export interface LearningDNADTO {
  student_id: number;
  student_name: string;
  cognitive_profile: Record<string, unknown>;
  strengths: string[];
  improvement_areas: string[];
  recommended_strategies: string[];
}

export type LearningDNAResponse = APIResponse<LearningDNADTO>;

/** GET /api/v1/teacher/classes/{id}/risk-alerts */
export interface RiskAlertDTO {
  student_id: number;
  student_name: string;
  risk_level: "High" | "Medium" | "Low";
  reason: string;
  metric_triggered: string;
  alert_date: string;
}

export type RiskAlertsListResponse = APIResponse<RiskAlertDTO[]>;

/** POST /api/v1/teacher/shared-goals — Request body */
export interface SharedGoalCreate {
  student_id: number;
  teacher_id: number;
  parent_id: number;
  title: string;
  description: string;
  target_date?: string | null;
}

/** PUT /api/v1/teacher/shared-goals/{id} — Request body */
export interface SharedGoalUpdate {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  target_date?: string | null;
}

/** Shared Goal response DTO */
export interface SharedGoalDTO {
  id: number;
  student_id: number;
  teacher_id: number;
  parent_id: number;
  title: string;
  description: string;
  status: string;
  target_date: string | null;
  created_at: string;
}

export type SharedGoalResponse = APIResponse<SharedGoalDTO>;
export type SharedGoalListResponse = APIResponse<SharedGoalDTO[]>;

/** POST /api/v1/teacher/assignments — Request body */
export interface AssignmentCreate {
  subject_id: number;
  class_id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  max_marks?: number;
  is_graded?: boolean;
  has_deadline?: boolean;
  due_date?: string | null;
  notify_parent_on_overdue?: boolean;
  status?: "Draft" | "Published" | "Closed";
  published_at?: string | null;
  attachment_bucket?: string | null;
  attachment_path?: string | null;
}

/** PUT /api/v1/teacher/assignments/{id} — Request body */
export interface AssignmentUpdate {
  title?: string | null;
  description?: string | null;
  instructions?: string | null;
  max_marks?: number | null;
  is_graded?: boolean;
  has_deadline?: boolean;
  due_date?: string | null;
  notify_parent_on_overdue?: boolean;
  status?: "Draft" | "Published" | "Closed" | null;
  published_at?: string | null;
  attachment_bucket?: string | null;
  attachment_path?: string | null;
}

/** Assignment DTO — read response */
export interface AssignmentDTO {
  id: number;
  teacher_id: number;
  subject_id: number;
  class_id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  max_marks: number;
  is_graded?: boolean | null;
  has_deadline?: boolean | null;
  due_date?: string | null;
  notify_parent_on_overdue?: boolean | null;
  status: "Draft" | "Published" | "Closed";
  published_at: string | null;
  attachment_bucket: string | null;
  attachment_path: string | null;
  created_at: string;
  subject_name?: string | null;
  teacher_name?: string | null;
}

export type AssignmentResponse = APIResponse<AssignmentDTO>;
export type AssignmentListResponse = APIResponse<AssignmentDTO[]>;

/** Submission DTOs */
export interface SubmissionSubmit {
  file_bucket: string;
  file_path: string;
}

export interface SubmissionGrade {
  score: number;
  feedback?: string | null;
}

export interface SubmissionDTO {
  id: number;
  assignment_id: number;
  student_id: number;
  status: string;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  file_bucket: string | null;
  file_path: string | null;
  created_at: string;
}

export type SubmissionResponse = APIResponse<SubmissionDTO>;
export type SubmissionListResponse = APIResponse<SubmissionDTO[]>;

/** Student Roster DTOs */
export interface TeacherStudentDTO {
  id: number;
  user_id: number;
  name: string;
  email: string;
  roll_number?: string | null;
  class_id?: number | null;
  class_name?: string | null;
  academic_score: number;
  completion_rate: number;
}

export type TeacherStudentListResponse = APIResponse<TeacherStudentDTO[]>;

export interface StudentDetailReportDTO {
  student_id: number;
  user_id: number;
  name: string;
  email: string;
  class_name: string;
  roll_number: string;
  overall_academic_score: number;
  completion_rate: number;
  submitted_count: number;
  pending_count: number;
  overdue_count: number;
  submissions: Array<{
    id: number;
    assignment_id: number;
    title: string;
    max_marks: number;
    status: string;
    submitted_at: string | null;
    score: number | null;
    feedback: string | null;
    file_bucket: string | null;
    file_path: string | null;
  }>;
}

export type StudentDetailReportResponse = APIResponse<StudentDetailReportDTO>;

export interface SubmissionReviewDTO {
  submission_id: number;
  assignment_id: number;
  assignment_title: string;
  class_id: number;
  class_name: string;
  student_id: number;
  student_name: string;
  status: string;
  submitted_at: string | null;
  score: number | null;
  feedback: string | null;
  file_bucket: string | null;
  file_path: string | null;
}

export type SubmissionReviewListResponse = APIResponse<SubmissionReviewDTO[]>;

/** Learning Resource DTOs */
export interface LearningResourceCreate {
  subject_id: number;
  title: string;
  description?: string | null;
  file_bucket: string;
  file_path: string;
}

export interface LearningResourceDTO {
  id: number;
  subject_id: number;
  teacher_id: number;
  title: string;
  description: string | null;
  file_bucket: string;
  file_path: string;
  created_at: string;
}

export type LearningResourceResponse = APIResponse<LearningResourceDTO>;
export type LearningResourceListResponse = APIResponse<LearningResourceDTO[]>;

/** GET /api/v1/teachers/timetable */
export interface TeacherTimetableSlotDTO {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number | null;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_published: boolean;
  class_name: string | null;
  subject_name: string | null;
  teacher_name: string | null;
}

export interface TeacherTimetableSummaryDTO {
  todays_classes: number;
  weekly_classes: number;
  free_periods: number;
  assigned_classes: string[];
}

export interface TeacherTimetableDataDTO {
  summary: TeacherTimetableSummaryDTO;
  slots: TeacherTimetableSlotDTO[];
}

export type TeacherTimetableResponse = APIResponse<TeacherTimetableDataDTO>;
