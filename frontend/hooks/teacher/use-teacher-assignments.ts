"use client";

import { useState, useEffect, useCallback } from "react";
import { teacherService } from "@/services/teacher.service";
import type { AssignmentDTO, AssignmentCreate, AssignmentUpdate } from "@/types/teacher.types";
import { toast } from "sonner";

export function useTeacherAssignments() {
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teacherService.getAssignments();
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

  const createAssignment = async (data: AssignmentCreate): Promise<AssignmentDTO | null> => {
    setIsSaving(true);
    try {
      const response = await teacherService.createAssignment(data);
      if (response.success && response.data) {
        toast.success("Assignment created successfully!");
        setAssignments((prev) => [response.data, ...prev]);
        return response.data;
      }
      toast.error(response.message || "Failed to create assignment");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating assignment");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateAssignment = async (id: number, data: AssignmentUpdate): Promise<AssignmentDTO | null> => {
    setIsSaving(true);
    try {
      const response = await teacherService.updateAssignment(id, data);
      if (response.success && response.data) {
        toast.success("Assignment updated successfully!");
        setAssignments((prev) => prev.map((a) => (a.id === id ? response.data : a)));
        return response.data;
      }
      toast.error(response.message || "Failed to update assignment");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating assignment");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAssignment = async (id: number): Promise<boolean> => {
    try {
      const response = await teacherService.deleteAssignment(id);
      if (response.success) {
        toast.success("Assignment deleted");
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        return true;
      }
      toast.error(response.message || "Failed to delete assignment");
      return false;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error deleting assignment");
      return false;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    isLoading,
    isSaving,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refetch: fetchAssignments,
  };
}
