"use client";

import { useState, useEffect, useCallback } from "react";
import { aiService } from "@/services/ai.service";
import type { AIAnalysisData } from "@/types/ai.types";

export function useStudentRadar(classId: number = 10) {
  const [data, setData] = useState<AIAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRadar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await aiService.getStudentRadar(classId);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || "Failed to load student radar data");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching student radar");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchRadar();
  }, [fetchRadar]);

  return { data, isLoading, error, refetch: fetchRadar };
}
