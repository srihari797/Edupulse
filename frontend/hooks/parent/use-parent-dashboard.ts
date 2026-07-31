"use client";

import { useState, useEffect, useCallback } from "react";
import { parentService } from "@/services/parent.service";
import type { ParentDashboardDTO } from "@/types/parent.types";

export function useParentDashboard(initialMode: "mock" | "real" = "mock") {
  const [mode, setMode] = useState<"mock" | "real">(initialMode);
  const [data, setData] = useState<ParentDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (currentMode: "mock" | "real") => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await parentService.getDashboard(currentMode);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load parent dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading parent dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(mode);
  }, [mode, fetchDashboard]);

  return { data, isLoading, error, mode, setMode, refetch: () => fetchDashboard(mode) };
}
