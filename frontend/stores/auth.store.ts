"use client";

/**
 * auth.store.ts — Global authentication state (Zustand).
 *
 * Single source of truth for:
 * - Current user (UserDTO from backend)
 * - JWT token presence
 * - Authentication status
 * - Loading state during token verification
 *
 * On app boot: reads token from localStorage → calls /auth/me → hydrates user.
 */

import { create } from "zustand";
import { clearToken, getToken } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants";
import type { UserDTO, LoginRequest } from "@/types/auth.types";
import type { RoleId } from "@/types/common.types";

interface AuthState {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Login with email + password */
  login: (credentials: LoginRequest) => Promise<string>; // returns redirect path
  /** Clear token and reset state */
  logout: () => Promise<void>;
  /** Call on app mount — re-hydrate user from stored token */
  initialize: () => Promise<void>;
  /** Clear any error message */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // start as loading — we check token on mount
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const user = response.data.user;
      set({ user, isAuthenticated: true, isLoading: false });
      // Return the correct dashboard path for this role
      const roleId = (user.role_id ?? 1) as RoleId;
      return ROLE_DASHBOARD_PATHS[roleId] ?? "/student/dashboard";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  initialize: async () => {
    const token = getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const response = await authService.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or expired
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

/** Convenience selector — current user's role_id */
export const useRole = (): RoleId | null => {
  const user = useAuthStore((s) => s.user);
  return (user?.role_id as RoleId) ?? null;
};
