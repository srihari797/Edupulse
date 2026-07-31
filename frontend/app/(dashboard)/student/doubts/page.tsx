"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { useStudentDoubts } from "@/hooks/student/use-doubts";
import { MessageCircleQuestion, Send, UserCheck, Clock, CheckCircle2, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface FacultyOption {
  teacher_id: number;
  teacher_name: string;
  subject_id: number;
  subject_name: string;
  department: string;
}

export default function StudentDoubtsPage() {
  const { doubts, isLoading, isCreating, error, createDoubt, refetch } = useStudentDoubts();

  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  
  // Class-specific faculty mappings loaded dynamically from PostgreSQL
  const [facultyOptions, setFacultyOptions] = useState<FacultyOption[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [isFetchingOptions, setIsFetchingOptions] = useState(true);

  useEffect(() => {
    async function loadClassFacultyOptions() {
      try {
        const res = await api.get<any>("/students/faculty-options");
        const list: FacultyOption[] = Array.isArray(res) ? res : (res?.data || []);
        setFacultyOptions(list);

        if (list.length > 0) {
          setSelectedTeacherId(String(list[0].teacher_id));
        }
      } catch {
        toast.error("Failed to load class teachers from database");
      } finally {
        setIsFetchingOptions(false);
      }
    }

    loadClassFacultyOptions();
  }, []);

  // Find the selected teacher object to derive assigned subject automatically
  const selectedFaculty = facultyOptions.find((f) => String(f.teacher_id) === selectedTeacherId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFaculty) {
      toast.error("Please select a target faculty teacher.");
      return;
    }
    if (!title.trim() || !query.trim()) {
      toast.error("Please enter a title and question detail.");
      return;
    }

    const res = await createDoubt({
      teacher_id: selectedFaculty.teacher_id,
      subject_id: selectedFaculty.subject_id,
      title: title.trim(),
      query: query.trim(),
    });

    if (res) {
      toast.success("Doubt submitted to teacher! Notification sent.");
      setTitle("");
      setQuery("");
      refetch();
    }
  };

  if (isLoading || isFetchingOptions) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ask Doubts" subtitle="Loading class faculty and Q/A history..." />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Ask Doubts" subtitle="Teacher Q/A Resolution" />
        <ErrorState title="Could not load doubts" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Ask Doubts & Faculty Q/A Hub"
        subtitle="Submit academic queries directly to the teachers handling your class in PostgreSQL and track responses in real-time"
      />

      {/* ── Ask Doubt Form Box ── */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <MessageCircleQuestion size={18} className="text-[var(--primary)]" />
          Ask a Subject Teacher a Doubt
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Select Class Faculty Teacher *
              </label>
              {facultyOptions.length === 0 ? (
                <div className="h-10 px-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-muted)] flex items-center">
                  No teachers assigned to your class yet
                </div>
              ) : (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                >
                  {facultyOptions.map((f) => (
                    <option key={`${f.teacher_id}-${f.subject_id}`} value={f.teacher_id}>
                      {f.teacher_name} ({f.subject_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Assigned Subject (Auto-Derived from Teacher)
              </label>
              <div className="h-10 px-3.5 rounded-xl text-xs bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-bold flex items-center gap-2">
                <BookOpen size={14} />
                <span>{selectedFaculty ? selectedFaculty.subject_name : "Select a teacher first"}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Doubt Title / Topic Summary *
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Question on Quadratic Formula derivation in Chapter 4"
              className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Detailed Query / Question *
            </label>
            <textarea
              required
              maxLength={1000}
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your doubt in detail so your teacher can provide a clear explanation..."
              className="w-full p-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isCreating || !title.trim() || !query.trim() || !selectedFaculty}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send size={14} />
              <span>{isCreating ? "Sending..." : "Submit Doubt to Teacher"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── Doubts History ── */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center justify-between">
          <span>My Doubts & Teacher Responses ({doubts.length})</span>
        </h3>

        {doubts.length === 0 ? (
          <EmptyState
            title="No questions submitted yet"
            description="Use the form above to ask your subject teacher any concept or homework doubt."
            icon={MessageCircleQuestion}
          />
        ) : (
          <div className="space-y-4">
            {doubts.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--primary)]/15 text-[var(--primary)]">
                        {item.subject_name || "Subject"}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                        <UserCheck size={13} /> {item.teacher_name || "Faculty Teacher"}
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

                {/* Query Content */}
                <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line bg-[var(--background)]/50 p-3 rounded-xl border border-[var(--border)]">
                  {item.query}
                </p>

                {/* Teacher / AI Response */}
                {item.response ? (
                  item.response.includes("AI Preliminary Hint") ? (
                    <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)]">
                        <Sparkles size={14} /> AI Assistant Preliminary Explanation (Pending Teacher Review):
                      </div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line pt-1">
                        {item.response.replace(/🤖\s*\[AI Preliminary Hint\]:\s*/, "")}
                      </p>
                      <div className="text-[10px] text-[var(--text-secondary)] italic pt-1">
                        * Note: This instant explanation is generated by EduPulse AI. {item.teacher_name} will review and confirm this response soon.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--success)]">
                        <CheckCircle2 size={14} /> Teacher Verified Response ({item.teacher_name}):
                      </div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-line pt-1">
                        {item.response}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-[11px] text-[var(--text-muted)] italic flex items-center gap-1 pt-1">
                    <Clock size={12} /> Pending response from {item.teacher_name}. You will be notified as soon as they reply.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
