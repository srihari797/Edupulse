"use client";

import { useState, useEffect, useCallback } from "react";
import { teacherService } from "@/services/teacher.service";
import type { TeacherDashboardDTO } from "@/types/teacher.types";

export function useTeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teacherService.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load teacher dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
