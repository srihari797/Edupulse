/**
 * parent.service.ts — Parent module API calls.
 * Paths match backend modules/parent/router.py exactly.
 */

import { api } from "@/lib/api";
import type {
  ParentDashboardResponse,
  BusTrackingResponse,
  AICoachQueryRequest,
  AICoachResponse,
  AICoachHistoryResponse,
} from "@/types/parent.types";

export const parentService = {
  getDashboard: (mode?: "mock" | "real") =>
    api.get<ParentDashboardResponse>(`/parents/dashboard${mode ? `?mode=${mode}` : ""}`),

  getBusTracking: () =>
    api.get<BusTrackingResponse>("/parents/bus-tracking"),

  askAICoach: (data: AICoachQueryRequest) =>
    api.post<AICoachResponse>("/parents/ai-coach", data),

  getAICoachHistory: () =>
    api.get<AICoachHistoryResponse>("/parents/ai-coach/history"),
};
