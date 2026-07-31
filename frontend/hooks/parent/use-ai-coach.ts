"use client";

import { useState, useEffect, useCallback } from "react";
import { parentService } from "@/services/parent.service";
import type { AICoachAdviceDTO } from "@/types/parent.types";
import { toast } from "sonner";

export function useAICoach() {
  const [history, setHistory] = useState<AICoachAdviceDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await parentService.getAICoachHistory();
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const askCoach = async (query: string): Promise<AICoachAdviceDTO | null> => {
    setIsAsking(true);
    try {
      const response = await parentService.askAICoach({ query });
      if (response.success && response.data) {
        toast.success("AI Parent Coach response generated!");
        setHistory((prev) => [response.data, ...prev]);
        return response.data;
      }
      toast.error(response.message || "Failed to generate advice");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error asking AI coach");
      return null;
    } finally {
      setIsAsking(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, isAsking, error, askCoach, refetch: fetchHistory };
}
