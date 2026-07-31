"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/badge";
import { useStudentAssignments } from "@/hooks/student/use-assignments";
import type { AssignmentDTO } from "@/types/teacher.types";
import { ClipboardList, Upload, CheckCircle2, FileText, X, UserCheck, BookOpen, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

export default function StudentAssignmentsPage() {
  const { assignments, isLoading, error, refetch } = useStudentAssignments();

  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Published" | "Closed">("All");
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDTO | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === "All") return true;
    return a.status === activeTab;
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !selectedFile) {
      toast.error("Please select a file to submit.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (description) {
        formData.append("description", description);
      }

      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/students/assignments/${selectedAssignment.id}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        toast.success("Assignment submitted successfully to Supabase Storage!");
        setSelectedAssignment(null);
        setSelectedFile(null);
        setDescription("");
        refetch();
      } else {
        toast.error(resData.detail || resData.message || "Upload failed");
      }
    } catch {
      toast.error("Network error submitting assignment file");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignments & Submissions" subtitle="Loading your coursework..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Assignments & Submissions" subtitle="Coursework & Submissions" />
        <ErrorState
          title="Could not load assignments"
          message={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Assignments & Submissions"
        subtitle="View due homework, submit completed work to Supabase Storage, and track grading"
      />

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
        {(["All", "Published", "Closed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              activeTab === tab
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Table List ── */}
      {filteredAssignments.length === 0 ? (
        <EmptyState
          title="No assignments found"
          description="You don't have any assignments matching this filter."
          icon={ClipboardList}
        />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Title & Details</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Assigned Teacher</th>
                  <th className="py-3.5 px-4">Max Marks</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                      <div>
                        <span className="font-bold text-sm block">{assignment.title}</span>
                        {assignment.description && (
                          <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[var(--primary)]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={13} />
                        {assignment.subject_name || `Subject #${assignment.subject_id}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <UserCheck size={13} />
                        {assignment.teacher_name || "Faculty Teacher"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                      {assignment.max_marks} pts
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={assignment.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedAssignment(assignment)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
                      >
                        <Upload size={13} />
                        Submit Work
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Automated Submission Upload Drawer ── */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Submit Assignment Work
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {selectedAssignment.title} ({selectedAssignment.subject_name || "Subject"})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setSelectedFile(null);
                }}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--background)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              {/* Optional Description / Comments */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Submission Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any notes or context for your teacher..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* File Upload Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Select Completed Work File (PDF, DOCX, PNG, ZIP) *
                </label>
                <div className="relative p-4 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)] transition-colors text-center cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <FileText size={24} className="text-[var(--primary)]" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {selectedFile ? selectedFile.name : "Click to select or drag & drop file"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "Files automatically routed to edupulse-submissions bucket"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Upload size={13} className={isUploading ? "animate-bounce" : ""} />
                  <span>{isUploading ? "Uploading to Supabase..." : "Confirm & Submit Work"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
