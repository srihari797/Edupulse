"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/badge";
import { teacherService } from "@/services/teacher.service";
import type { SharedGoalDTO } from "@/types/teacher.types";
import { Target, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function TeacherSharedGoalsPage() {
  const [goals, setGoals] = useState<SharedGoalDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [studentId, setStudentId] = useState(1);
  const [parentId, setParentId] = useState(2);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    teacherService
      .getSharedGoalsForStudent(1)
      .then((res) => {
        if (res.success && res.data) setGoals(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      const res = await teacherService.createSharedGoal({
        student_id: Number(studentId),
        teacher_id: 3,
        parent_id: Number(parentId),
        title: title.trim(),
        description: description.trim(),
        target_date: targetDate || undefined,
      });

      if (res.success && res.data) {
        toast.success("Shared Goal created!");
        setGoals((prev) => [res.data, ...prev]);
        setTitle("");
        setDescription("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Shared Goals" subtitle="Loading goals..." />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="Shared Goals" subtitle="Teacher-Parent-Student Collaborative Goals" />
        <ErrorState title="Could not load shared goals" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Teacher-Parent-Student Shared Goals"
        subtitle="Collaborative developmental milestones tracked across school and home"
      />

      {/* Create Form Box */}
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <Target size={16} className="text-[var(--primary)]" />
          Create New Shared Goal
        </h3>

        <form onSubmit={handleCreateGoal} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Goal Title (e.g. Complete 5 Math remediation modules before Friday)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
          />

          <textarea
            rows={2}
            placeholder="Detailed description of expectations for student & parent..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
          />

          <div className="flex items-center justify-between gap-3">
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
            />

            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{isCreating ? "Saving..." : "Create Shared Goal"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Goal List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Active Shared Goals ({goals.length})
        </h3>

        {goals.length === 0 ? (
          <EmptyState
            title="No shared goals created yet"
            description="Create a goal above to coordinate student improvement targets with parents."
            icon={Target}
          />
        ) : (
          <div className="space-y-3">
            {goals.map((g) => (
              <div key={g.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)]">{g.title}</h4>
                  <StatusBadge status={g.status} />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{g.description}</p>
                <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)] pt-1 font-mono">
                  <span>Student #{g.student_id}</span>
                  <span>Parent #{g.parent_id}</span>
                  {g.target_date && <span>Target: {g.target_date}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
