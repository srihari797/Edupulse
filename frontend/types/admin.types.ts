/**
 * admin.types.ts — Admin module type definitions.
 * 1-to-1 mirror of backend modules/admin/schemas.py
 */

import { APIResponse } from "./common.types";

/** Admin Users */
export interface AdminUserCreate {
  email: string;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  role_id: number;
}

export interface AdminUserUpdate {
  first_name?: string | null;
  last_name?: string | null;
  role_id?: number | null;
  is_active?: boolean | null;
}

export interface AdminUserResetPassword {
  password: string;
}

export interface AdminUserDTO {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: number | null;
  is_active: boolean;
}

export type AdminUserResponse = APIResponse<AdminUserDTO>;
export type AdminUserListResponse = APIResponse<AdminUserDTO[]>;

/** Classes */
export interface ClassCreate {
  name: string;
  grade?: string | null;
  section?: string | null;
}

export interface ClassUpdate {
  name?: string | null;
  grade?: string | null;
  section?: string | null;
  is_active?: boolean | null;
}

export interface ClassDTO {
  id: number;
  name: string;
  grade: string | null;
  section: string | null;
  is_active: boolean;
}

export type ClassResponse = APIResponse<ClassDTO>;
export type ClassListResponse = APIResponse<ClassDTO[]>;

/** Sections */
export interface SectionCreate {
  name: string;
}

export interface SectionUpdate {
  name?: string | null;
  is_active?: boolean | null;
}

export interface SectionDTO {
  id: number;
  name: string;
  is_active: boolean;
}

export type SectionResponse = APIResponse<SectionDTO>;
export type SectionListResponse = APIResponse<SectionDTO[]>;

/** Subjects */
export interface SubjectCreate {
  name: string;
  code: string;
}

export interface SubjectUpdate {
  name?: string | null;
  code?: string | null;
  is_active?: boolean | null;
}

export interface SubjectDTO {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export type SubjectResponse = APIResponse<SubjectDTO>;
export type SubjectListResponse = APIResponse<SubjectDTO[]>;

/** Academic Years */
export interface AcademicYearCreate {
  name: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface AcademicYearUpdate {
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
}

export interface AcademicYearDTO {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export type AcademicYearResponse = APIResponse<AcademicYearDTO>;
export type AcademicYearListResponse = APIResponse<AcademicYearDTO[]>;

/** Teacher Assignments */
export interface TeacherAssignmentCreate {
  teacher_id: number;
  class_id: number;
  subject_id: number;
  is_homeroom?: boolean;
}

export interface TeacherAssignmentDTO {
  id: number;
  teacher_id: number;
  class_id: number;
  subject_id: number;
  is_homeroom: boolean;
  created_at: string;
}

export type TeacherAssignmentResponse = APIResponse<TeacherAssignmentDTO>;
export type TeacherAssignmentListResponse = APIResponse<TeacherAssignmentDTO[]>;

/** Student Management */
export interface StudentClassMapRequest {
  student_id: number;
  class_id: number;
}

export interface ParentLinkRequest {
  student_id: number;
  parent_id: number;
}

export interface StudentPromotionRequest {
  student_ids: number[];
  target_class_id: number;
}

export interface ParentLinkDTO {
  id: number;
  student_id: number;
  parent_id: number;
  created_at: string;
}

export type ParentLinkResponse = APIResponse<ParentLinkDTO>;

export interface StudentPromotionDTO {
  promoted_count: number;
  target_class_id: number;
}

export type StudentPromotionResponse = APIResponse<StudentPromotionDTO>;

/** Timetable Slots */
export interface TimetableSlotCreate {
  class_id: number;
  subject_id: number;
  teacher_id?: number | null;
  day_of_week: string;
  period_number?: number;
  start_time: string;
  end_time: string;
}

export interface TimetableSlotDTO {
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

export type TimetableSlotResponse = APIResponse<TimetableSlotDTO>;
export type TimetableSlotListResponse = APIResponse<TimetableSlotDTO[]>;

/** Timetable Publish */
export interface TimetablePublishSlot {
  class_id: number;
  subject_id: number;
  teacher_id?: number | null;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
}

export interface TimetablePublishRequest {
  class_id: number;
  working_days: string[];
  periods_per_day: number;
  slots: TimetablePublishSlot[];
}

/** Teacher Availability (for timetable wizard Step 3) */
export interface TeacherAvailabilityDTO {
  id: number;
  user_id: number;
  name: string;
  email: string;
  subject_name: string;
  subject_id: number | null;
  assigned_classes: string[];
  status: string;
}

export type TeacherAvailabilityListResponse = APIResponse<TeacherAvailabilityDTO[]>;

/** Calendar Events */
export interface CalendarEventCreate {
  title: string;
  description?: string | null;
  event_date: string;
  is_holiday?: boolean;
}

export interface CalendarEventDTO {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  is_holiday: boolean;
}

export type CalendarEventResponse = APIResponse<CalendarEventDTO>;
export type CalendarEventListResponse = APIResponse<CalendarEventDTO[]>;

/** Settings */
export interface SystemSettingCreate {
  key: string;
  value: string;
}

export interface SystemSettingDTO {
  id: number;
  key: string;
  value: string;
}

export type SystemSettingResponse = APIResponse<SystemSettingDTO>;
export type SystemSettingListResponse = APIResponse<SystemSettingDTO[]>;

/** Admin Dashboard */
export interface AdminDashboardDTO {
  student_count: number;
  teacher_count: number;
  class_count: number;
  system_status: string;
  active_alerts_count: number;
}

export type AdminDashboardResponse = APIResponse<AdminDashboardDTO>;
