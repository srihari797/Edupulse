"use client";

import { useState, useEffect, useCallback } from "react";
import { studentService } from "@/services/student.service";
import type { GrowthPassportDTO, RecognitionDTO } from "@/types/growth.types";

export function useGrowthPassport() {
  const [passport, setPassport] = useState<GrowthPassportDTO | null>(null);
  const [recognition, setRecognition] = useState<RecognitionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPassport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [passportRes, recognitionRes] = await Promise.all([
        studentService.getGrowthPassport().catch(() => null),
        studentService.getRecognition().catch(() => null),
      ]);

      if (passportRes?.success && passportRes.data) {
        setPassport(passportRes.data);
      }
      if (recognitionRes?.success && recognitionRes.data) {
        setRecognition(recognitionRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching growth passport");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  return { passport, recognition, isLoading, error, refetch: fetchPassport };
}
