/**
 * common.types.ts — Shared base types used across all modules.
 * Mirror of the backend's APIResponse base class.
 */

/** Standard API envelope — every backend response wraps data in this */
export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/** Breadcrumb navigation item */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Role IDs — frozen, match backend exactly */
export type RoleId = 1 | 2 | 3 | 4;

/** Generic select option for dropdowns */
export interface SelectOption {
  label: string;
  value: string | number;
}
