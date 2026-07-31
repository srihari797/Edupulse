"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { MessageCircleQuestion, Send, UserCheck, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface TeacherDoubtItem {
  id: number;
  student_id: number;
  student_name: string;
  roll_number: string;
  teacher_id: number;
  subject_id: number;
  subject_name: string;
  title: string;
  query: string;
  response: string | null;
  status: string;
  created_at: string;
}

export default function TeacherDoubtsPage() {
  const [doubts, setDoubts] = useState<TeacherDoubtItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Answered" | "Resolved">("All");

  // Per-card response input states
  const [responseInputs, setResponseInputs] = useState<Record<number, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<number, "Answered" | "Resolved">>({});
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

  const fetchDoubts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>("/teacher/doubts");
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDoubts(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load student doubts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleTextChange = (doubtId: number, val: string) => {
    setResponseInputs((prev) => ({ ...prev, [doubtId]: val }));
  };

  const handleStatusChange = (doubtId: number, val: "Answered" | "Resolved") => {
    setStatusInputs((prev) => ({ ...prev, [doubtId]: val }));
  };

  const handleSendResponse = async (doubtId: number) => {
    const textToSubmit = responseInputs[doubtId] || "";
    if (!textToSubmit.trim()) {
      toast.error("Please enter a response explanation.");
      return;
    }

    const selectedStatus = statusInputs[doubtId] || "Answered";

    setIsSubmitting(doubtId);
    try {
      const res = await api.post<any>(`/teacher/doubts/${doubtId}/respond`, {
        response: textToSubmit.trim(),
        status: selectedStatus,
      });

      if (res) {
        toast.success("Response submitted! Student has been notified.");
        setEditingCardId(null);
        fetchDoubts();
      }
    } catch {
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(null);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (activeTab === "All") return true;
    return d.status === activeTab;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Doubts & Q/A Resolution" subtitle="Loading student queries..." />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Student Doubts" subtitle="Academic Q/A Resolution" />
        <ErrorState title="Could not load doubts" message={error} onRetry={fetchDoubts} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Student Academic Doubts Resolution"
        subtitle="Review concept queries submitted by your students, post detailed explanations, and notify them in real-time"
      />

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
        {(["All", "Pending", "Answered", "Resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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

      {/* ── Doubts List ── */}
      {filteredDoubts.length === 0 ? (
        <EmptyState
          title="No student doubts matching filter"
          description="Student doubts addressed to your subjects will appear here."
          icon={MessageCircleQuestion}
        />
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((item) => {
            const currentInputValue = responseInputs[item.id] !== undefined ? responseInputs[item.id] : (item.response || "");
            const currentStatusValue = statusInputs[item.id] || (item.status === "Resolved" ? "Resolved" : "Answered");
            const isEditing = editingCardId === item.id || !item.response;

            return (
              <div
                key={item.id}
                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm hover:border-[var(--border-accent)] transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--primary)]/15 text-[var(--primary)]">
                        {item.subject_name}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center gap-1">
                        <UserCheck size={13} /> {item.student_name} ({item.roll_number})
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1.5">{item.title}</h4>
                  </div>

                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1",
                      item.status === "Answered" || item.status === "Resolved"
                        ? "bg-[var(--success)]/15 text-[var(--success)]"
                        : "bg-[var(--warning)]/15 text-[var(--warning)]"
                    )}
                  >
                    <Clock size={11} /> {item.status}
                  </span>
                </div>

                {/* Student Query Box */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Student Question Details:</span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                    {item.query}
                  </p>
                </div>

                {/* Existing Teacher Response Box */}
                {item.response && !isEditing ? (
                  <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--success)]">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> My Saved Response:
                      </span>
                      <button
                        onClick={() => {
                          setEditingCardId(item.id);
                          setResponseInputs((prev) => ({ ...prev, [item.id]: item.response || "" }));
                        }}
                        className="text-[10px] text-[var(--primary)] underline hover:opacity-80 font-bold"
                      >
                        Edit Response
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line pt-1">
                      {item.response}
                    </p>
                  </div>
                ) : null}

                {/* Response Input Form */}
                {isEditing ? (
                  <div className="pt-2 border-t border-[var(--border)] space-y-3">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {item.response ? "Update Response Explanation:" : "Type Explanation & Resolve Doubt:"}
                    </label>
                    <textarea
                      rows={3}
                      value={currentInputValue}
                      onChange={(e) => handleTextChange(item.id, e.target.value)}
                      placeholder="Provide a clear, step-by-step academic explanation for your student..."
                      className="w-full p-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">Mark status as:</span>
                        <select
                          value={currentStatusValue}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as "Answered" | "Resolved")}
                          className="h-8 px-2 rounded-lg text-xs bg-[var(--background)] border border-[var(--border)] font-semibold text-[var(--text-primary)]"
                        >
                          <option value="Answered">Answered</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.response && (
                          <button
                            type="button"
                            onClick={() => setEditingCardId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--background)]"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleSendResponse(item.id)}
                          disabled={isSubmitting === item.id || !currentInputValue.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Send size={13} />
                          <span>{isSubmitting === item.id ? "Sending..." : "Send Response & Notify Student"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
