/**
 * parent.types.ts — Parent module type definitions.
 * 1-to-1 mirror of backend modules/parent/schemas.py
 */
import { APIResponse } from "./common.types";

/** GET /api/v1/parents/dashboard */
export interface ParentDashboardDTO {
  linked_students?: any[];
  [key: string]: unknown; // Backend returns dynamic data
}

export type ParentDashboardResponse = APIResponse<ParentDashboardDTO>;

/** GET /api/v1/parents/bus-tracking */
export interface BusTrackingDTO {
  [key: string]: unknown;
}

export type BusTrackingResponse = APIResponse<BusTrackingDTO>;

/** POST /api/v1/parents/ai-coach — Request body */
export interface AICoachQueryRequest {
  query: string;
}

/** AI Coach advice response DTO */
export interface AICoachAdviceDTO {
  [key: string]: unknown;
}

export type AICoachResponse = APIResponse<AICoachAdviceDTO>;
export type AICoachHistoryResponse = APIResponse<AICoachAdviceDTO[]>;
