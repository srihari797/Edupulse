"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface WorkloadItem {
  id: number;
  subject_name: string;
  teacher_name: string;
  title: string;
  description: string;
  due_date: string | null;
  due_date_clean: string;
  max_marks: number;
  is_graded: boolean;
  priority: "High" | "Moderate" | "Low";
  status: string;
  score?: number | null;
  feedback?: string | null;
}

interface TeacherContribution {
  teacher_name: string;
  subject_name: string;
  item_count: number;
}

interface ConflictAlert {
  date: string;
  active_count: number;
  status: string;
  warning: string;
}

interface WorkloadData {
  active_work: WorkloadItem[];
  past_work: WorkloadItem[];
  teacher_contributions: TeacherContribution[];
  conflict_alerts: ConflictAlert[];
}

export default function StudentWorkloadPage() {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPastWork, setShowPastWork] = useState(false);

  const fetchWorkload = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: WorkloadData }>("/students/workload-intelligence");
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      toast.error("Failed to load workload intelligence");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="AI Workload Intelligence & Conflict Detector"
        subtitle="Monitors teacher assignment schedules, prevents student burnout, and flags multi-exam conflicts"
      />

      {/* ── AI Conflict Overload Warning Banners ── */}
      {data?.conflict_alerts && data.conflict_alerts.length > 0 ? (
        <div className="space-y-3">
          {data.conflict_alerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 flex items-center justify-between text-xs shadow-sm animate-in fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] shrink-0 font-bold">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--danger)] text-sm">
                      Day Overloaded: {alert.date}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--danger)] text-white">
                      Overloaded ({alert.active_count} Active Works)
                    </span>
                  </div>
                  <span className="text-[var(--text-secondary)] mt-0.5 block">
                    {alert.warning}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 flex items-center gap-3 text-xs shadow-sm">
          <CheckCircle2 size={18} className="text-[var(--success)] shrink-0" />
          <span className="text-[var(--text-primary)] font-medium">
            Optimal Schedule: No daily workload overlap detected (All days have &le; 2 active assignments).
          </span>
        </div>
      )}

      {/* ── Teacher Workload Contribution Graph ── */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity size={18} className="text-[var(--primary)]" />
              Teacher Workload Contribution & Distribution
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Weekly assignment & test load published by subject faculty
            </p>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={
                data?.teacher_contributions && data.teacher_contributions.length > 0
                  ? data.teacher_contributions
                  : [
                      { teacher_name: "Teacher 4 (Math)", subject_name: "Mathematics", item_count: 2 },
                      { teacher_name: "Teacher 5 (Science)", subject_name: "Science", item_count: 1 },
                      { teacher_name: "Teacher 2 (Tamil)", subject_name: "Tamil", item_count: 1 },
                    ]
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="teacher_name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="item_count" name="Assigned Items" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Section 1: Current Active Work ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
          <span>Active Workload ({data?.active_work.length ?? 0})</span>
          <span className="text-[10px] text-[var(--warning)] font-mono font-semibold">Priority Categorized</span>
        </h3>

        {isLoading ? (
          <SkeletonRow count={3} />
        ) : !data?.active_work || data.active_work.length === 0 ? (
          <div className="p-6 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)]">
            No pending active assignments. All workload caught up!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.active_work.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-sm hover:border-[var(--border-accent)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--primary)]/15 text-[var(--primary)]">
                    {item.subject_name}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      item.priority === "High"
                        ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                        : "bg-[var(--warning)]/15 text-[var(--warning)]"
                    )}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">{item.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-[var(--text-secondary)] font-medium">
                    <UserCheck size={12} /> {item.teacher_name}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--warning)] font-mono font-semibold">
                    <Clock size={12} /> Due: {item.due_date_clean}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Past Work (Expandable Collapsible Accordion) ── */}
      <div className="pt-4 border-t border-[var(--border)] space-y-3">
        <button
          onClick={() => setShowPastWork(!showPastWork)}
          className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[var(--success)]" />
            <span>Past Work & Completed History ({data?.past_work.length ?? 0})</span>
          </div>
          {showPastWork ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPastWork && (
          <div className="space-y-3 animate-in fade-in">
            {!data?.past_work || data.past_work.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-muted)] italic">
                No past completed work history found.
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[10px] text-[var(--text-muted)] uppercase">
                      <th className="py-2.5 px-4">Subject</th>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-4">Teacher</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.past_work.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-hover)]">
                        <td className="py-3 px-4 font-semibold text-[var(--primary)]">{item.subject_name}</td>
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{item.title}</td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">{item.teacher_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--success)]/15 text-[var(--success)]">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[var(--primary)]">
                          {item.score !== null ? `${item.score} / ${item.max_marks}` : "Grading Pending"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
