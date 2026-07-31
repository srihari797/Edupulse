"use client";

import { useState, useEffect, useCallback } from "react";
import { teacherService } from "@/services/teacher.service";
import type { RiskAlertDTO } from "@/types/teacher.types";

export function useRiskAlerts(classId: number = 10) {
  const [alerts, setAlerts] = useState<RiskAlertDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teacherService.getRiskAlerts(classId);
      if (response.success && response.data) {
        setAlerts(response.data);
      } else {
        setError(response.message || "Failed to load risk alerts");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching risk alerts");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, isLoading, error, refetch: fetchAlerts };
}
