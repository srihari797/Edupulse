/**
 * student.types.ts — Student module type definitions.
 * 1-to-1 mirror of backend modules/student/schemas.py
 */
import { APIResponse } from "./common.types";

/** GET /api/v1/students/profile */
export interface StudentProfileDTO {
  id: number;
  user_id: number;
  class_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string | null;
  date_of_birth: string | null; // ISO date string
  gender: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

/** PUT /api/v1/students/profile — Request body */
export interface StudentProfileUpdate {
  roll_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
}

export type StudentProfileResponse = APIResponse<StudentProfileDTO>;

/** GET /api/v1/students/dashboard */
export interface StudentDashboardDTO {
  academic_overview: {
    gpa: number;
    rank: number;
    completed_credits: number;
    total_credits: number;
  };
  attendance: {
    present_percentage: number;
    total_days: number;
    days_present: number;
  };
  workload: {
    pending_assignments: number;
    due_this_week: number;
    completed_assignments: number;
    pressure_level?: string | null;
  };
  learning_health: {
    score: number;
    status: string;
    weak_concepts_count: number;
  };
  growth_passport: {
    holistic_score: number;
    badges_count: number;
    achievements_count: number;
  };
  notifications: {
    unread_count: number;
  };
  workload_pressure_trend?: Array<{ day: string; workload: number; pressure: string; level: number }>;
  subject_growth_trend?: Array<Record<string, string | number>>;
  extracurricular_analytics?: Array<{ category: string; score: number; count: number }>;
}

export type StudentDashboardResponse = APIResponse<StudentDashboardDTO>;

/** GET/POST /api/v1/students/study-plan & exam-plan */
export interface StudyPlanDTO {
  id: number;
  student_id: number;
  plan_type: string;
  plan_data: Record<string, unknown>;
  created_at: string;
}

export type StudyPlanResponse = APIResponse<StudyPlanDTO>;

/** GET /api/v1/students/opportunities */
export interface OpportunityDTO {
  id: number;
  title: string;
  description: string;
  opportunity_type: string; // Scholarship, Competition, Hackathon, Club
  organization: string;
  deadline: string; // ISO date string
  recommended_reason: string;
}

export type OpportunityListResponse = APIResponse<OpportunityDTO[]>;

/** POST /api/v1/students/doubts — Request body */
export interface DoubtCreate {
  teacher_id: number;
  subject_id: number;
  title: string;
  query: string;
}

/** GET/POST /api/v1/students/doubts */
export interface DoubtDTO {
  id: number;
  student_id: number;
  teacher_id: number;
  subject_id: number;
  subject_name?: string;
  teacher_name?: string;
  title: string;
  query: string;
  response: string | null;
  status: "Pending" | "Answered" | "Resolved";
  created_at: string;
}

export type DoubtResponse = APIResponse<DoubtDTO>;
export type DoubtListResponse = APIResponse<DoubtDTO[]>;

/** GET /api/v1/students/timetable */
export interface StudentTimetableSlotDTO {
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

export type StudentTimetableListResponse = APIResponse<StudentTimetableSlotDTO[]>;
