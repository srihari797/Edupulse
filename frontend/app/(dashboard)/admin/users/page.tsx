"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { RoleBadge } from "@/components/common/role-badge";
import { useAdminUsers } from "@/hooks/admin/use-admin-users";
import type { AdminUserDTO } from "@/types/admin.types";
import { Users, Plus, KeyRound, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { users, isLoading, isSaving, error, createUser, resetPassword, refetch } =
    useAdminUsers();

  const [roleFilter, setRoleFilter] = useState<number>(0); // 0 = All
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<AdminUserDTO | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState(1);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 0 || u.role_id === roleFilter;
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.first_name || ""} ${u.last_name || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const res = await createUser({
      email: email.trim(),
      password: password.trim(),
      first_name: firstName.trim() || undefined,
      last_name: lastName.trim() || undefined,
      role_id: Number(roleId),
    });

    if (res) {
      setShowCreateModal(false);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPassword.trim()) return;
    const ok = await resetPassword(resettingUser.id, newPassword.trim());
    if (ok) {
      setResettingUser(null);
      setNewPassword("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="User Management" subtitle="Loading users list..." />
        <SkeletonRow count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="User Management" subtitle="System User Directory" />
        <ErrorState title="Could not load users" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="User Account Management"
        subtitle="Manage student, parent, teacher, and administrator accounts"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>Create New User</span>
          </button>
        }
      />

      {/* Search & Role Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1">
          {[
            { label: "All Users", value: 0 },
            { label: "Students", value: 1 },
            { label: "Parents", value: 2 },
            { label: "Teachers", value: 3 },
            { label: "Admins", value: 4 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setRoleFilter(tab.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                roleFilter === tab.value
                  ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-9 pr-3 rounded text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Users Data Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No user accounts match your search"
          description="Try adjusting your role filter or search query."
          icon={Users}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                      #{user.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                      {user.first_name || user.last_name
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <RoleBadge roleId={user.role_id ?? 1} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setResettingUser(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                        title="Reset password"
                      >
                        <KeyRound size={13} />
                        Reset Pwd
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Create New User Account
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@edupulse.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  System Role
                </label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                >
                  <option value={1}>Student (1)</option>
                  <option value={2}>Parent (2)</option>
                  <option value={3}>Teacher (3)</option>
                  <option value={4}>Admin (4)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !email.trim() || !password.trim()}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Reset Password — {resettingUser.email}
              </h3>
              <button
                onClick={() => setResettingUser(null)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPassword.trim()}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
