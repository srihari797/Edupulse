"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/badge";
import { useTeacherAssignments } from "@/hooks/teacher/use-teacher-assignments";
import type { AssignmentDTO } from "@/types/teacher.types";
import { Plus, Trash2, ClipboardList, X, Calendar, Clock, Bell, Award, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

const formatDueDate = (dueStr: string) => {
  if (!dueStr) return "";
  try {
    const clean = dueStr.trim().replace(" ", "T").replace("Z", "").split("+")[0];
    const [datePart, timePart] = clean.split("T");
    if (!datePart) return dueStr;
    const [y, m, d] = datePart.split("-");
    if (!y || !m || !d) return dueStr;

    if (!timePart) return `${m}/${d}/${y}`;

    const [hhStr, mmStr] = timePart.trim().split(":");
    let hh = parseInt(hhStr, 10);
    if (isNaN(hh)) return `${m}/${d}/${y}`;

    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const minutes = mmStr ? mmStr.substring(0, 2) : "00";

    return `${m}/${d}/${y}, ${hh}:${minutes} ${ampm}`;
  } catch {
    return dueStr;
  }
};

export default function TeacherAssignmentsPage() {
  const {
    assignments,
    isLoading,
    isSaving,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    refetch,
  } = useTeacherAssignments();

  const [activeTab, setActiveTab] = useState<"All" | "Draft" | "Published" | "Closed">("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Academic Options State
  const [classesList] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "Grade 10-A" },
    { id: 2, name: "Grade 10-B" },
    { id: 3, name: "Grade 11-Science" },
    { id: 4, name: "Grade 12-Physics" },
  ]);
  const [subjectsList] = useState<Array<{ id: number; name: string }>>([
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Physics" },
    { id: 3, name: "Chemistry" },
    { id: 4, name: "Computer Science" },
  ]);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [classId, setClassId] = useState<number>(1);
  const [subjectId, setSubjectId] = useState<number>(1);

  // Graded / Ungraded
  const [isGraded, setIsGraded] = useState(true);
  const [maxMarks, setMaxMarks] = useState(100);

  // Deadline Options
  const [hasDeadline, setHasDeadline] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");

  // Parent Notification
  const [notifyParentOnOverdue, setNotifyParentOnOverdue] = useState(true);
  const [status, setStatus] = useState<"Published" | "Draft">("Published");

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === "All") return true;
    return a.status === activeTab;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueDate: string | undefined = undefined;
    if (hasDeadline && dueDate) {
      finalDueDate = `${dueDate}T${dueTime || "23:59"}:00`;
    }

    const res = await createAssignment({
      title: title.trim(),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      max_marks: isGraded ? Number(maxMarks) : 0,
      is_graded: isGraded,
      has_deadline: hasDeadline,
      due_date: finalDueDate,
      notify_parent_on_overdue: notifyParentOnOverdue,
      subject_id: Number(subjectId) || 1,
      class_id: Number(classId) || 1,
      status: status,
    });

    if (res) {
      toast.success(`Assignment '${title}' ${status === "Published" ? "published" : "saved as draft"} successfully!`);
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setInstructions("");
      setHasDeadline(false);
    }
  };

  const handleQuickPublish = async (assignment: AssignmentDTO) => {
    const res = await updateAssignment(assignment.id, { status: "Published" });
    if (res) {
      toast.success(`Assignment '${assignment.title}' published to class!`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Classroom Assignments" subtitle="Loading assignment list..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Classroom Assignments" subtitle="Coursework Management" />
        <ErrorState title="Could not load assignments" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Classroom Assignment Management"
        subtitle="Create graded/ungraded coursework, configure deadlines, enable parent notifications, and publish to students"
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Create Assignment</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
        {(["All", "Published", "Draft", "Closed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === tab
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Assignment Table */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments match this status"
          description="Click 'Create Assignment' to configure new graded/ungraded coursework."
          icon={ClipboardList}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Type & Grading</th>
                  <th className="py-3 px-4">Deadline Config</th>
                  <th className="py-3 px-4">Parent Alert</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAssignments.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--text-primary)] max-w-xs">
                      <div>
                        <span className="font-semibold text-xs text-[var(--text-primary)]">{item.title}</span>
                        {item.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.is_graded !== false ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary)]/15 text-[var(--primary)]">
                          Graded ({item.max_marks} pts)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-hover)] text-[var(--text-muted)]">
                          Ungraded
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {item.has_deadline && item.due_date ? (
                        <div className="flex items-center gap-1 text-[var(--warning)] font-semibold">
                          <Clock size={12} />
                          <span>{formatDueDate(item.due_date)}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">No Deadline</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.notify_parent_on_overdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded">
                          <Bell size={10} /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">Disabled</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {item.status === "Draft" && (
                        <button
                          onClick={() => handleQuickPublish(item)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[var(--success)] text-white hover:bg-[var(--success)]/90 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle size={12} /> Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteAssignment(item.id)}
                        className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-hover)] transition-colors"
                        title="Delete assignment"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border-accent)] bg-[var(--surface)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Create & Configure Assignment</h3>
                <p className="text-xs text-[var(--text-muted)]">Set grading rules, deadline timing, and parent alerts</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus Derivatives & Quadratic Modeling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* Description & Instructions */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Description & Student Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed instructions or submission formatting requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              {/* Graded vs Ungraded Toggle */}
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Award size={14} className="text-[var(--primary)]" />
                    Grading System
                  </span>
                  <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setIsGraded(true)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        isGraded ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"
                      )}
                    >
                      Graded
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGraded(false)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        !isGraded ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"
                      )}
                    >
                      Ungraded
                    </button>
                  </div>
                </div>

                {isGraded && (
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                      Maximum Marks (Points)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(Number(e.target.value))}
                      className="w-32 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                    />
                  </div>
                )}
              </div>

              {/* Deadline Configuration */}
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Calendar size={14} className="text-[var(--warning)]" />
                    Submission Deadline
                  </span>
                  <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setHasDeadline(true)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        hasDeadline ? "bg-[var(--warning)] text-black" : "text-[var(--text-muted)]"
                      )}
                    >
                      Deadline
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasDeadline(false)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-semibold transition-colors",
                        !hasDeadline ? "bg-[var(--primary)] text-white" : "text-[var(--text-muted)]"
                      )}
                    >
                      No Deadline
                    </button>
                  </div>
                </div>

                {hasDeadline && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        required={hasDeadline}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                        Due Time
                      </label>
                      <input
                        type="time"
                        required={hasDeadline}
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Parent Overdue Notification Checkbox */}
              <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[var(--primary)]" />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)] block">Parent Overdue Notification</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      Automatically alert parents if student fails to submit before deadline
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyParentOnOverdue}
                  onChange={(e) => setNotifyParentOnOverdue(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>

              {/* Status & Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Initial Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Published" | "Draft")}
                    className="px-2 py-1 rounded bg-[var(--background)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]"
                  >
                    <option value="Published">Publish Immediately</option>
                    <option value="Draft">Save as Draft</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !title.trim()}
                    className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    {isSaving ? "Saving..." : status === "Published" ? "Publish Assignment" : "Save Draft"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
