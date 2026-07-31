/**
 * api.ts — EduPulse HTTP Client
 *
 * Single source of truth for all API calls.
 * - Reads base URL from NEXT_PUBLIC_API_BASE_URL env var
 * - Injects Bearer token from localStorage on every request
 * - Handles 401 (session expired) by clearing token
 * - Standardized error handling and typed responses
 *
 * Rule: NEVER import this file on the server side.
 * It reads localStorage which only exists in the browser.
 */

import { AUTH_TOKEN_KEY, API_BASE_URL } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Error types
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token management
// ─────────────────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core request function
// ─────────────────────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  /** If true, skip auth header (for login endpoint) */
  skipAuth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, skipAuth = false } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Execute request
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      0,
      "NetworkError",
      "Could not connect to EduPulse backend (http://localhost:8000). Please ensure the FastAPI backend is running."
    );
  }

  // Handle session expiry — backend returns 401
  if (response.status === 401) {
    clearToken();
    // Redirect to login without breaking the app
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Session expired", "Your session has expired. Please log in again.");
  }

  // Parse response body
  let data: unknown;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Handle HTTP errors
  if (!response.ok) {
    const errorData = data as Record<string, unknown>;
    const detail =
      (errorData?.detail as string) ??
      (errorData?.message as string) ??
      "An unexpected error occurred.";

    throw new ApiError(response.status, detail, detail);
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

export const api = {
  get<T>(
    path: string,
    params?: RequestOptions["params"]
  ): Promise<T> {
    return apiRequest<T>(path, { method: "GET", params });
  },

  post<T>(path: string, body?: unknown, skipAuth = false): Promise<T> {
    return apiRequest<T>(path, { method: "POST", body, skipAuth });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, { method: "PUT", body });
  },

  delete<T>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: "DELETE" });
  },
};
