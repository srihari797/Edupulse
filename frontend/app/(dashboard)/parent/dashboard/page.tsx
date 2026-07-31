"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { SkeletonCard, SkeletonGrid } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { StatusDot } from "@/components/common/status-dot";
import { useParentDashboard } from "@/hooks/parent/use-parent-dashboard";
import { Bot, Bus, Heart, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ParentDashboardPage() {
  const { data, isLoading, error, mode, setMode, refetch } = useParentDashboard("mock");

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Parent Portal" subtitle="Loading child wellness feed..." />
        <SkeletonGrid count={3} />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="Parent Portal" subtitle="Child Development & School Digest" />
        <ErrorState
          title="Could not load parent portal"
          message={error || "Ensure backend is running."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const student = data.linked_students?.[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Page Header ── */}
      <PageHeader
        title="Parent Portal — Child Development Digest"
        subtitle="Calm narrative overview of your child's academic growth, wellness, and school updates"
        actions={
          <div className="flex items-center gap-3">
            {/* ── Mock Data / Real Data Toggle ── */}
            <div className="flex items-center gap-2 bg-[var(--surface)] px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium">
              <span className={mode === "mock" ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-muted)]"}>
                Mock Data
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={mode === "real"}
                onClick={() => setMode(mode === "mock" ? "real" : "mock")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  mode === "real" ? "bg-[var(--primary)]" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    mode === "real" ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={mode === "real" ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-muted)]"}>
                Real Data
              </span>
            </div>

            <Link
              href="/parent/ai-coach"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Bot size={14} />
              <span>Ask AI Parent Coach</span>
            </Link>
          </div>
        }
      />

      {/* ── Student Digest Content / Empty State ── */}
      {!student ? (
        <div className="p-8 text-center rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <ShieldCheck size={32} className="mx-auto text-[var(--text-muted)]" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">No Linked Student Records Found</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            {mode === "real"
              ? "No active student mappings found for this parent account in the database."
              : "No mock student data available."}
          </p>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status="healthy" size="sm" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {student.first_name} {student.last_name} — {student.class_name} Digest ({mode === "real" ? "Real Data Mode" : "Mock Data Mode"})
              </h3>
            </div>
            <span className="text-xs text-[var(--text-muted)] font-mono">July 2026 Digest</span>
          </div>

          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {student.first_name} has had a remarkably positive week in {student.class_name}. Academic progress is standing strong with a GPA of {student.academic_progress?.gpa ?? 3.8} (Grade {student.academic_progress?.grade ?? "A"}).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
            <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Learning Health</span>
              <span className="metric text-lg font-bold text-[var(--success)]">
                {student.growth_passport?.holistic_score ?? 85} / 100
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                {student.growth_passport?.growth_level ?? "Optimal Range"}
              </span>
            </div>
            <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Attendance Record</span>
              <span className="metric text-lg font-bold text-[var(--text-primary)]">
                {student.attendance?.percentage ?? 92.5}%
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                {student.attendance?.status ?? "Consistent"}
              </span>
            </div>
            <div className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)] block">Homework Stress Index</span>
              <span className="metric text-lg font-bold text-[var(--primary)]">
                {student.workload_overview?.overload_status ?? "Low"}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                {student.workload_overview?.pending_assignments ?? 0} Pending
              </span>
            </div>
          </div>

          {student.recent_achievements && student.recent_achievements.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)] space-y-2">
              <span className="text-xs font-semibold text-[var(--text-primary)] block">Recent Achievements</span>
              <div className="flex flex-wrap gap-2">
                {student.recent_achievements.map((ach: { title: string; category: string }, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                  >
                    <CheckCircle2 size={12} />
                    {ach.title} ({ach.category})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Quick Features Access ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Parent Coach Tile */}
        <Link
          href="/parent/ai-coach"
          className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-accent)] transition-colors flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                AI Parent Coach
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Ask queries about home study schedules, motivation advice, or understanding school reports.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-[var(--primary)]">
            <span>Ask Coach</span>
            <ArrowRight size={13} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Bus Tracking Tile */}
        <Link
          href="/parent/bus-tracking"
          className="group p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-accent)] transition-colors flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)] shrink-0">
              <Bus size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--success)] transition-colors">
                School Bus Tracking
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                View real-time ETA and simulated transit route status for safe pick-up & drop-off.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-[var(--success)]">
            <span>Track Bus Route</span>
            <ArrowRight size={13} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  );
}
