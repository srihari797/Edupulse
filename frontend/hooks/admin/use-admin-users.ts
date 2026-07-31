"use client";

import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/admin.service";
import type { AdminUserDTO, AdminUserCreate, AdminUserUpdate } from "@/types/admin.types";
import { toast } from "sonner";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.message || "Failed to load users");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (data: AdminUserCreate): Promise<AdminUserDTO | null> => {
    setIsSaving(true);
    try {
      const response = await adminService.createUser(data);
      if (response.success && response.data) {
        toast.success(`User ${response.data.email} created successfully!`);
        setUsers((prev) => [response.data, ...prev]);
        return response.data;
      }
      toast.error(response.message || "Failed to create user");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error creating user");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateUser = async (id: number, data: AdminUserUpdate): Promise<AdminUserDTO | null> => {
    setIsSaving(true);
    try {
      const response = await adminService.updateUser(id, data);
      if (response.success && response.data) {
        toast.success("User updated successfully!");
        setUsers((prev) => prev.map((u) => (u.id === id ? response.data : u)));
        return response.data;
      }
      toast.error(response.message || "Failed to update user");
      return null;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error updating user");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const resetPassword = async (id: number, password: string): Promise<boolean> => {
    try {
      const response = await adminService.resetUserPassword(id, { password });
      if (response.success) {
        toast.success("Password reset successfully!");
        return true;
      }
      toast.error(response.message || "Failed to reset password");
      return false;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error resetting password");
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    isLoading,
    isSaving,
    error,
    createUser,
    updateUser,
    resetPassword,
    refetch: fetchUsers,
  };
}
