"use client";

import { useState, useEffect, useCallback } from "react";
import { parentService } from "@/services/parent.service";
import type { BusTrackingDTO } from "@/types/parent.types";

export function useBusTracking() {
  const [data, setData] = useState<BusTrackingDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await parentService.getBusTracking();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load bus tracking info");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching bus tracking");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  return { data, isLoading, error, refetch: fetchTracking };
}
