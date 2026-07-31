"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { CalendarCheck, Plus, ShieldAlert, Award, Clock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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

interface ClassTestDTO {
  id: number;
  title: string;
  max_marks: number;
  due_date: string | null;
  status: string;
}

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<ClassTestDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [maxMarks, setMaxMarks] = useState(25);
  const [testDate, setTestDate] = useState("");
  const [testTime, setTestTime] = useState("10:00");
  const [testType, setTestType] = useState<"ClassTest" | "SurpriseQuiz" | "MidTerm">("ClassTest");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: ClassTestDTO[] }>("/teacher/tests");
      if (res.success && res.data) {
        setTests(res.data);
      }
    } catch {
      toast.error("Failed to load class tests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleScheduleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !testDate) return;

    if (testType === "MidTerm") {
      toast.error("Main institutional exams (Mid-Term, Final) are restricted to Admin publishing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message: string }>("/teacher/tests", {
        title: title.trim(),
        description: description.trim() || undefined,
        max_marks: maxMarks,
        test_date: `${testDate}T${testTime}:00`,
        test_type: testType,
      });

      if (res.success) {
        toast.success(`Class Test '${title}' published for your class!`);
        setShowModal(false);
        setTitle("");
        setDescription("");
        fetchTests();
      } else {
        toast.error(res.message || "Failed to schedule test");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Scheduling error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Class Test & Quiz Scheduler"
        subtitle="Schedule unit tests and surprise quizzes for your assigned classes. Main institutional exams are published by Admin."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Schedule Class Test</span>
          </button>
        }
      />

      {/* Admin Notice Callout */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert size={18} className="text-[var(--warning)] shrink-0" />
          <div>
            <span className="font-bold text-[var(--text-primary)] block">Institutional Exam Policy</span>
            <span className="text-[var(--text-secondary)]">
              Teachers can schedule Class Tests, Unit Tests, and Quizzes. Mid-Term, Quarterly, and Final Examinations are strictly published by the Admin Panel.
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonRow count={4} />
      ) : tests.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <CalendarCheck size={28} className="mx-auto text-[var(--primary)]" />
          <h4 className="text-xs font-bold text-[var(--text-primary)]">No Scheduled Class Tests</h4>
          <p className="text-xs text-[var(--text-muted)]">Click &quot;Schedule Class Test&quot; to publish a unit test or quiz for your class.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Max Marks</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{t.title}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[var(--primary)]">{t.max_marks} pts</td>
                  <td className="py-3 px-4 font-mono text-[var(--warning)]">
                    {t.due_date ? formatDueDate(t.due_date) : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--success)]/15 text-[var(--success)]">
                      Published
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border-accent)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Schedule Class Test</h3>
                <p className="text-xs text-[var(--text-muted)]">Configure test details for your class</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--surface-hover)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleScheduleTest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Test Category *
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-semibold"
                >
                  <option value="ClassTest">Class Unit Test (Teacher Allowed)</option>
                  <option value="SurpriseQuiz">Surprise Quiz (Teacher Allowed)</option>
                  <option value="MidTerm">Mid-Term Examination (Admin Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Trigonometry Quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={testTime}
                    onChange={(e) => setTestTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !testDate}
                  className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-medium flex items-center gap-1"
                >
                  <Check size={14} />
                  <span>{isSubmitting ? "Publishing..." : "Publish Class Test"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
