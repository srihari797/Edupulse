/**
 * auth.service.ts — Authentication API service.
 * Calls the backend auth endpoints using the central api client.
 * DO NOT modify endpoint paths — they are frozen.
 */

import { api } from "@/lib/api";
import { setToken } from "@/lib/api";
import type {
  LoginRequest,
  LoginResponse,
  CurrentUserResponse,
} from "@/types/auth.types";

export const authService = {
  /**
   * POST /api/v1/auth/login
   * Authenticates with email + password, stores token on success.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      "/auth/login",
      credentials,
      true // skipAuth — login endpoint does not need a token
    );
    if (response.success && response.data?.access_token) {
      setToken(response.data.access_token);
    }
    return response;
  },

  /**
   * POST /api/v1/auth/logout
   * Stateless — token is cleared client-side.
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors on logout — clear token regardless
    }
  },

  /**
   * GET /api/v1/auth/me
   * Retrieves the current authenticated user's profile.
   */
  async getMe(): Promise<CurrentUserResponse> {
    return api.get<CurrentUserResponse>("/auth/me");
  },
};
