"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { adminService } from "@/services/admin.service";
import type { SystemSettingDTO } from "@/types/admin.types";
import { Settings, Plus, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getSettings();
      if (res.success && res.data) setSettings(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading system settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string) => {
    setIsSaving(true);
    try {
      const res = await adminService.updateSetting(key, editValue);
      if (res.success && res.data) {
        toast.success(`Setting '${key}' updated!`);
        setSettings((prev) => prev.map((s) => (s.key === key ? res.data : s)));
        setEditingKey(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    setIsSaving(true);
    try {
      const res = await adminService.createSetting({
        key: newKey.trim(),
        value: newValue.trim(),
      });

      if (res.success && res.data) {
        toast.success(`Setting '${res.data.key}' created!`);
        setSettings((prev) => [res.data, ...prev]);
        setShowCreateModal(false);
        setNewKey("");
        setNewValue("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create setting");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="System Settings" subtitle="Loading configuration..." />
        <SkeletonRow count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="System Settings" subtitle="Institutional Configurations" />
        <ErrorState title="Could not load settings" message={error} onRetry={fetchSettings} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="System Settings & Key-Value Configurations"
        subtitle="Manage global school preferences, academic parameters, and system defaults"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>Add Configuration Key</span>
          </button>
        }
      />

      {settings.length === 0 ? (
        <EmptyState
          title="No system settings configured"
          description="Click 'Add Configuration Key' to define institutional variables."
          icon={Settings}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Configuration Key</th>
                <th className="py-3 px-4">Current Value</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {settings.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-mono font-medium text-[var(--primary)]">
                    {item.key}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-primary)]">
                    {editingKey === item.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 px-2 rounded bg-[var(--background)] border border-[var(--border)] w-full text-xs font-mono"
                      />
                    ) : (
                      <span className="font-mono">{item.value}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingKey === item.key ? (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleUpdate(item.key)}
                          disabled={isSaving}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--primary)] text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-2.5 py-1 rounded text-xs text-[var(--text-secondary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(item.key);
                          setEditValue(item.value);
                        }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        title="Edit setting"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Setting Key</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. max_class_capacity"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Value</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 40"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
                <button type="submit" disabled={isSaving || !newKey.trim()} className="px-4 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded">Save Key</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
