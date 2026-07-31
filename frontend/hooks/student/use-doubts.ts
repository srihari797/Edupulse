"use client";

import { useState, useEffect, useCallback } from "react";
import { studentService } from "@/services/student.service";
import type { DoubtDTO, DoubtCreate } from "@/types/student.types";
import { toast } from "sonner";

export function useStudentDoubts() {
  const [doubts, setDoubts] = useState<DoubtDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoubts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getDoubts();
      const list = Array.isArray(response) ? response : (response?.data || []);
      setDoubts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching doubts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDoubt = async (data: DoubtCreate): Promise<DoubtDTO | null> => {
    setIsCreating(true);
    try {
      const response = await studentService.createDoubt(data);
      if (response.success && response.data) {
        toast.success("Doubt submitted successfully!");
        setDoubts((prev) => [response.data, ...prev]);
        return response.data;
      }
      toast.error(response.message || "Failed to submit doubt");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error submitting doubt");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  return { doubts, isLoading, isCreating, error, createDoubt, refetch: fetchDoubts };
}
