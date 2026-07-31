"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { teacherService } from "@/services/teacher.service";
import type { SubmissionReviewDTO } from "@/types/teacher.types";
import { ClipboardList, CheckCircle2, Clock, Download, Award, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionReviewDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "Submitted" | "Graded">("all");

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<SubmissionReviewDTO | null>(null);
  const [score, setScore] = useState<number>(85);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await teacherService.getSubmissions();
      if (res.success && res.data) {
        setSubmissions(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assignment submissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenGradeModal = (sub: SubmissionReviewDTO) => {
    setGradingSubmission(sub);
    setScore(sub.score ?? 85);
    setFeedback(sub.feedback ?? "Good effort! Clear conceptual understanding shown.");
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setIsSubmittingGrade(true);
    try {
      const res = await teacherService.gradeSubmission(gradingSubmission.submission_id, {
        score,
        feedback,
      });
      if (res.success) {
        toast.success(`Graded ${gradingSubmission.student_name}: ${score} pts`);
        setSubmissions((prev) =>
          prev.map((item) =>
            item.submission_id === gradingSubmission.submission_id
              ? { ...item, status: "Graded", score, feedback }
              : item
          )
        );
        setGradingSubmission(null);
      } else {
        toast.error(res.message || "Failed to submit grade");
      }
    } catch {
      toast.error("Error submitting grade");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const filtered = submissions.filter((s) => (statusFilter === "all" ? true : s.status === statusFilter));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Assignment Submissions" subtitle="Loading submitted work..." />
        <SkeletonRow count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Student Assignment Submissions" subtitle="Submission Management" />
        <ErrorState title="Could not load submissions" message={error} onRetry={fetchSubmissions} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Submissions & Grading Review"
        subtitle="Review uploaded student assignment files, assess conceptual clarity, and record real-time grades in PostgreSQL"
        actions={
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                statusFilter === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              All ({submissions.length})
            </button>
            <button
              onClick={() => setStatusFilter("Submitted")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                statusFilter === "Submitted"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Pending Grading ({submissions.filter((s) => s.status === "Submitted").length})
            </button>
            <button
              onClick={() => setStatusFilter("Graded")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                statusFilter === "Graded"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Graded ({submissions.filter((s) => s.status === "Graded").length})
            </button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={statusFilter === "Submitted" ? "No pending submissions to grade" : "No student submissions recorded"}
          description="When students upload and submit assignments, their work will appear here automatically."
          icon={ClipboardList}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Sub ID</th>
                <th className="py-3 px-4">Assignment Title</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Attachment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((s) => (
                <tr key={s.submission_id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{s.submission_id}</td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{s.assignment_title}</td>
                  <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{s.student_name}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{s.class_name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        s.status === "Graded"
                          ? "bg-[var(--success)]/15 text-[var(--success)]"
                          : s.status === "Submitted"
                          ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                          : "bg-[var(--warning)]/15 text-[var(--warning)]"
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-sm">
                    {s.score !== null ? (
                      <span className="text-[var(--success)]">{s.score} pts</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {s.file_path ? (
                      <span className="inline-flex items-center gap-1 text-[var(--primary)] underline font-medium">
                        <Download size={12} />
                        File Attached
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Text Submission</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenGradeModal(s)}
                      className={cn(
                        "px-3 py-1 rounded text-xs font-medium transition-colors inline-flex items-center gap-1",
                        s.status === "Graded"
                          ? "border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
                          : "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
                      )}
                    >
                      <Award size={12} />
                      <span>{s.status === "Graded" ? "Re-grade" : "Grade Work"}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-accent)] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Grade Student Submission</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  {gradingSubmission.student_name} • {gradingSubmission.assignment_title}
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Assign Score (0-100 pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Teacher Feedback & Mastery Guidance
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter constructive teacher feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrade}
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-medium flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{isSubmittingGrade ? "Saving..." : "Save Grade"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
