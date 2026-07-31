"use client";

import { useState, useEffect, useCallback } from "react";
import { studentService } from "@/services/student.service";
import type { StudentDashboardDTO } from "@/types/student.types";

export function useStudentDashboard() {
  const [data, setData] = useState<StudentDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching dashboard";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
