/**
 * constants.ts — Application-wide frozen constants.
 *
 * Role IDs match the backend exactly (from auth/router.py):
 *   1 = Student
 *   2 = Parent
 *   3 = Teacher
 *   4 = Admin
 *
 * DO NOT change these values. They are dictated by the backend.
 */

export const ROLES = {
  STUDENT: 1,
  PARENT: 2,
  TEACHER: 3,
  ADMIN: 4,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_NAMES: Record<RoleId, string> = {
  1: "Student",
  2: "Parent",
  3: "Teacher",
  4: "Admin",
} as const;

export const ROLE_COLORS: Record<RoleId, string> = {
  1: "var(--primary)",    // Lavender-Blue
  2: "var(--success)",    // Emerald
  3: "var(--info)",       // Sky Blue
  4: "var(--warning)",    // Amber
} as const;

/** Dashboard redirect paths after login — keyed by role_id */
export const ROLE_DASHBOARD_PATHS: Record<RoleId, string> = {
  1: "/student/dashboard",
  2: "/parent/dashboard",
  3: "/teacher/dashboard",
  4: "/admin/dashboard",
} as const;

/** API base URL — reads from env, never hardcode */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Token storage key in localStorage */
export const AUTH_TOKEN_KEY = "edupulse_token";

/** Assignment statuses — match backend enum strings exactly */
export const ASSIGNMENT_STATUSES = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  CLOSED: "Closed",
} as const;

/** Submission statuses — match backend enum strings exactly */
export const SUBMISSION_STATUSES = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
} as const;

/** Doubt statuses — match backend enum strings exactly */
export const DOUBT_STATUSES = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
} as const;

/** Risk levels — match backend strings exactly */
export const RISK_LEVELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
} as const;

/** Shared goal statuses */
export const GOAL_STATUSES = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
