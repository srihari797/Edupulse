/**
 * admin.service.ts — Admin module API calls.
 * Matches backend modules/admin/router.py exactly.
 */

import { api } from "@/lib/api";
import type {
  AdminUserCreate,
  AdminUserUpdate,
  AdminUserResetPassword,
  AdminUserResponse,
  AdminUserListResponse,
  ClassCreate,
  ClassUpdate,
  ClassResponse,
  ClassListResponse,
  SectionCreate,
  SectionUpdate,
  SectionResponse,
  SectionListResponse,
  SubjectCreate,
  SubjectUpdate,
  SubjectResponse,
  SubjectListResponse,
  AcademicYearCreate,
  AcademicYearUpdate,
  AcademicYearResponse,
  AcademicYearListResponse,
  TeacherAssignmentCreate,
  TeacherAssignmentResponse,
  TeacherAssignmentListResponse,
  StudentClassMapRequest,
  ParentLinkRequest,
  StudentPromotionRequest,
  ParentLinkResponse,
  StudentPromotionResponse,
  TimetableSlotCreate,
  TimetableSlotDTO,
  TimetableSlotResponse,
  TimetableSlotListResponse,
  TimetablePublishRequest,
  TeacherAvailabilityListResponse,
  CalendarEventCreate,
  CalendarEventResponse,
  CalendarEventListResponse,
  SystemSettingCreate,
  SystemSettingResponse,
  SystemSettingListResponse,
  AdminDashboardResponse,
} from "@/types/admin.types";
import type { APIResponse } from "@/types/common.types";

export const adminService = {
  // Users
  createUser: (data: AdminUserCreate) => api.post<AdminUserResponse>("/admin/users", data),
  getUsers: (roleId?: number, search?: string) => {
    const params = new URLSearchParams();
    if (roleId !== undefined && roleId !== null) params.append("role_id", roleId.toString());
    if (search) params.append("search", search);
    const query = params.toString();
    return api.get<AdminUserListResponse>(`/admin/users${query ? `?${query}` : ""}`);
  },
  updateUser: (userId: number, data: AdminUserUpdate) => api.put<AdminUserResponse>(`/admin/users/${userId}`, data),
  resetUserPassword: (userId: number, data: AdminUserResetPassword) => api.post<APIResponse>(`/admin/users/${userId}/reset-password`, data),

  // Classes
  createClass: (data: ClassCreate) => api.post<ClassResponse>("/admin/classes", data),
  getClasses: () => api.get<ClassListResponse>("/admin/classes"),
  getClassStudents: (classId: number) =>
    api.get<APIResponse<{ id: number; roll_number?: string; name: string; email: string; is_active: boolean }[]>>(`/admin/classes/${classId}/students`),
  updateClass: (classId: number, data: ClassUpdate) => api.put<ClassResponse>(`/admin/classes/${classId}`, data),
  deleteClass: (classId: number) => api.delete<APIResponse>(`/admin/classes/${classId}`),

  // Sections
  createSection: (data: SectionCreate) => api.post<SectionResponse>("/admin/sections", data),
  getSections: () => api.get<SectionListResponse>("/admin/sections"),
  updateSection: (sectionId: number, data: SectionUpdate) => api.put<SectionResponse>(`/admin/sections/${sectionId}`, data),
  deleteSection: (sectionId: number) => api.delete<APIResponse>(`/admin/sections/${sectionId}`),

  // Subjects
  createSubject: (data: SubjectCreate) => api.post<SubjectResponse>("/admin/subjects", data),
  getSubjects: () => api.get<SubjectListResponse>("/admin/subjects"),
  updateSubject: (subjectId: number, data: SubjectUpdate) => api.put<SubjectResponse>(`/admin/subjects/${subjectId}`, data),
  deleteSubject: (subjectId: number) => api.delete<APIResponse>(`/admin/subjects/${subjectId}`),

  // Academic Years
  createAcademicYear: (data: AcademicYearCreate) => api.post<AcademicYearResponse>("/admin/academic-years", data),
  getAcademicYears: () => api.get<AcademicYearListResponse>("/admin/academic-years"),
  updateAcademicYear: (yearId: number, data: AcademicYearUpdate) => api.put<AcademicYearResponse>(`/admin/academic-years/${yearId}`, data),
  deleteAcademicYear: (yearId: number) => api.delete<APIResponse>(`/admin/academic-years/${yearId}`),

  // Teacher Assignments
  assignTeacher: (data: TeacherAssignmentCreate) => api.post<TeacherAssignmentResponse>("/admin/teachers/assign", data),
  getTeacherAssignments: () => api.get<TeacherAssignmentListResponse>("/admin/teacher-assignments"),

  // Student Management
  mapStudentToClass: (data: StudentClassMapRequest) => api.post<APIResponse>("/admin/students/map-class", data),
  linkParentToStudent: (data: ParentLinkRequest) => api.post<ParentLinkResponse>("/admin/students/link-parent", data),
  promoteStudents: (data: StudentPromotionRequest) => api.post<StudentPromotionResponse>("/admin/students/promote", data),

  // Timetable
  createTimetableSlot: (data: TimetableSlotCreate) => api.post<TimetableSlotResponse>("/admin/timetable", data),
  getTimetable: (classId?: number) => {
    const query = classId ? `?class_id=${classId}` : "";
    return api.get<TimetableSlotListResponse>(`/admin/timetable${query}`);
  },
  getTimetableTeachers: () => api.get<TeacherAvailabilityListResponse>("/admin/timetable/teachers"),
  publishTimetable: (data: TimetablePublishRequest) => api.post<TimetableSlotListResponse>("/admin/timetable/publish", data),
  generateAITimetable: (classId: number, selectedTeacherIds?: number[]) =>
    api.post<APIResponse<{ class_id: number; class_name: string; ai_provider_active: boolean; ai_optimization_summary: string; slots: TimetableSlotDTO[] }>>(
      "/admin/timetable/generate",
      { class_id: classId, selected_teacher_ids: selectedTeacherIds }
    ),
  analyzeTimetable: (data: { slots: any[]; class_name: string; working_days: number; periods_per_day: number }) =>
    api.post<APIResponse<{ analysis: string; warnings: { message: string }[] }>>("/admin/timetable/analyze", data),

  // Calendar
  createCalendarEvent: (data: CalendarEventCreate) => api.post<CalendarEventResponse>("/admin/calendar", data),
  getCalendarEvents: () => api.get<CalendarEventListResponse>("/admin/calendar"),
  updateCalendarEvent: (eventId: number, data: Partial<CalendarEventCreate>) => api.put<CalendarEventResponse>(`/admin/calendar/${eventId}`, data),
  deleteCalendarEvent: (eventId: number) => api.delete<APIResponse>(`/admin/calendar/${eventId}`),

  // Settings
  createSetting: (data: SystemSettingCreate) => api.post<SystemSettingResponse>("/admin/settings", data),
  getSettings: () => api.get<SystemSettingListResponse>("/admin/settings"),
  getSettingByKey: (key: string) => api.get<SystemSettingResponse>(`/admin/settings/${key}`),
  updateSetting: (key: string, value: string) => api.put<SystemSettingResponse>(`/admin/settings/${key}`, { key, value }),

  // Admin Dashboard
  getDashboard: () => api.get<AdminDashboardResponse>("/admin/dashboard"),
};
