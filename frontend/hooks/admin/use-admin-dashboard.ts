"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import type { AdminDashboardDTO } from "@/types/admin.types";

export function useAdminDashboard() {
  const [data, setData] = useState<AdminDashboardDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load admin dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading admin dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, isLoading, error, refetch: fetchDashboard };
}
