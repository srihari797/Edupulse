"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { RiskCard } from "@/components/cards/risk-card";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { SkeletonGrid } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { useTeacherDashboard } from "@/hooks/teacher/use-teacher-dashboard";
import {
  Users,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
  BrainCircuit,
} from "lucide-react";
import { ProfileWarningBanner } from "@/components/common/profile-warning-banner";

export default function TeacherDashboardPage() {
  const { data, isLoading, error, refetch } = useTeacherDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher Dashboard" subtitle="Loading classroom statistics..." />
        <SkeletonGrid count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Teacher Dashboard" subtitle="Classroom Overview" />
        <ErrorState
          title="Could not load teacher dashboard"
          message={error || "Ensure backend is running."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const { classroom_summary, workload_overview, student_insights, risk_alerts } = data;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title={`Teacher Dashboard — ${classroom_summary.class_name}`}
        subtitle="Real-time classroom health, AI student insights, and risk alert radar"
        actions={
          <Link
            href="/teacher/risk-alerts"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 transition-colors"
          >
            <AlertTriangle size={13} />
            <span>Risk Radar ({risk_alerts.length})</span>
          </Link>
        }
      />

      {/* ── Top KPI Grid (Row 1) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Active Class Enrolled"
          value={classroom_summary.student_count}
          unit="students"
          delta={`${classroom_summary.average_attendance}% Attendance`}
          deltaType={classroom_summary.average_attendance >= 90 ? "positive" : "warning"}
          subtitle={classroom_summary.class_name}
          icon={Users}
          accentColor="var(--primary)"
        />
        <KpiCard
          title="Active Assignments"
          value={workload_overview.active_assignments}
          unit="published"
          delta={`${workload_overview.pending_grading} pending grading`}
          deltaType="warning"
          subtitle="Assignments active this week"
          icon={ClipboardList}
          accentColor="var(--info)"
        />
        <KpiCard
          title="Upcoming Exams"
          value={workload_overview.upcoming_exams}
          unit="scheduled"
          delta="Next: Chem Midterm"
          deltaType="neutral"
          subtitle="Workload overlap monitored"
          icon={BookOpen}
          accentColor="var(--warning)"
        />
        <KpiCard
          title="Risk Alerts Flagged"
          value={risk_alerts.length}
          unit="students"
          delta={risk_alerts.some((r) => r.risk_level === "High") ? "High Priority" : "Monitored"}
          deltaType={risk_alerts.some((r) => r.risk_level === "High") ? "negative" : "positive"}
          subtitle="Early withdrawal signals"
          icon={AlertTriangle}
          accentColor="var(--danger)"
        />
      </div>

      {/* ── Middle Row: AI Student Insights List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <BrainCircuit size={16} className="text-[var(--primary)]" />
            AI Cognitive Student Insights
          </h3>
          <Link
            href="/teacher/ai-analytics"
            className="text-xs text-[var(--primary)] font-medium hover:underline flex items-center gap-1"
          >
            AI Classroom Analytics <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {student_insights.map((item, idx) => (
            <AIInsightCard
              key={idx}
              title={`Student Observation — ${item.student_name}`}
              analysis={item.insight}
              confidence={91 + idx}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom Row: Risk Alert Stream ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            Classroom Risk Alert Stream
          </h3>
          <Link
            href="/teacher/risk-alerts"
            className="text-xs text-[var(--text-secondary)] font-medium hover:underline"
          >
            View all ({risk_alerts.length})
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risk_alerts.map((alert, idx) => (
            <RiskCard
              key={idx}
              studentName={alert.student_name}
              riskLevel={alert.risk_level}
              reason={alert.reason}
              metricTriggered="Attendance / Quiz Score"
              actions={
                <Link
                  href={`/teacher/students/1/learning-dna`}
                  className="text-[11px] font-medium text-[var(--primary)] hover:underline"
                >
                  Inspect DNA →
                </Link>
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
