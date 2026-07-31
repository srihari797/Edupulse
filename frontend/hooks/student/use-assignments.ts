"use client";

import { useState, useEffect, useCallback } from "react";
import { studentService } from "@/services/student.service";
import type { AssignmentDTO, SubmissionDTO, SubmissionSubmit } from "@/types/teacher.types";
import { toast } from "sonner";

export function useStudentAssignments() {
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getAssignments();
      if (response.success && response.data) {
        setAssignments(response.data);
      } else {
        setError(response.message || "Failed to load assignments");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching assignments");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAssignment = async (assignmentId: number, data: SubmissionSubmit): Promise<SubmissionDTO | null> => {
    setIsSubmitting(true);
    try {
      const response = await studentService.submitAssignment(assignmentId, data);
      if (response.success && response.data) {
        toast.success("Assignment submitted successfully!");
        fetchAssignments(); // Refresh assignment status list
        return response.data;
      }
      toast.error(response.message || "Submission failed");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error submitting assignment");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return { assignments, isLoading, isSubmitting, error, submitAssignment, refetch: fetchAssignments };
}
