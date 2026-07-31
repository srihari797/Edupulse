"use client";

import { useState, useEffect, useCallback } from "react";
import { studentService } from "@/services/student.service";
import type { StudentProfileDTO, StudentProfileUpdate } from "@/types/student.types";
import { toast } from "sonner";

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfileDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.message || "Failed to load profile");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (updates: StudentProfileUpdate) => {
    setIsSaving(true);
    try {
      const response = await studentService.updateProfile(updates);
      if (response.success && response.data) {
        setProfile(response.data);
        toast.success("Profile updated successfully");
        return true;
      }
      toast.error(response.message || "Failed to update profile");
      return false;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, isLoading, isSaving, error, updateProfile, refetch: fetchProfile };
}
