/**
 * auth.types.ts — Authentication type definitions.
 * 1-to-1 mirror of backend auth/schemas.py
 */
import { APIResponse } from "./common.types";

/** POST /api/v1/auth/login — Request body */
export interface LoginRequest {
  username: string; // email address
  password: string;
}

/**
 * UserDTO — Authenticated user profile.
 * Mirror of backend UserDTO in auth/schemas.py
 */
export interface UserDTO {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role_id: number | null;
  is_active: boolean;
}

/** POST /api/v1/auth/login — Response data payload */
export interface LoginResponseData {
  access_token: string;
  token_type: "bearer";
  user: UserDTO;
}

/** POST /api/v1/auth/login — Full response */
export type LoginResponse = APIResponse<LoginResponseData>;

/** GET /api/v1/auth/me — Full response */
export type CurrentUserResponse = APIResponse<UserDTO>;
