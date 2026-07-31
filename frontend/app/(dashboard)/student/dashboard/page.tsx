"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { GrowthRadar } from "@/components/charts/growth-radar";
import { SkeletonGrid, SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { useStudentDashboard } from "@/hooks/student/use-student-dashboard";
import {
  HeartPulse,
  Activity,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  ClipboardList,
  LineChart as LineChartIcon,
  TrendingUp,
  Brain,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function StudentDashboardPage() {
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Student Dashboard" subtitle="Loading your personalized learning overview..." />
        <SkeletonGrid count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Student Dashboard" subtitle="Overview & Learning Health" />
        <ErrorState
          title="Could not load dashboard data"
          message={error || "Connecting to live backend..."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const {
    academic_overview,
    attendance,
    workload,
    learning_health,
    growth_passport,
    workload_pressure_trend = [],
    subject_growth_trend = [],
    extracurricular_analytics = [],
  } = data;

  // Fallback defaults for visual charts if empty
  const defaultWorkloadTrend = [
    { day: "Mon", workload: 2, pressure: "Moderate", level: 45 },
    { day: "Tue", workload: 4, pressure: "High", level: 75 },
    { day: "Wed", workload: 1, pressure: "Low", level: 25 },
    { day: "Thu", workload: 5, pressure: "Overload", level: 90 },
    { day: "Fri", workload: 3, pressure: "Moderate", level: 55 },
    { day: "Sat", workload: 1, pressure: "Low", level: 20 },
    { day: "Sun", workload: 2, pressure: "Low", level: 30 },
  ];

  const defaultSubjectGrowth = [
    { period: "Week 1", Tamil: 82, English: 85, Mathematics: 78, Science: 88, SocialScience: 84 },
    { period: "Week 2", Tamil: 85, English: 87, Mathematics: 84, Science: 90, SocialScience: 86 },
    { period: "Week 3", Tamil: 87, English: 89, Mathematics: 88, Science: 92, SocialScience: 88 },
    { period: "Week 4", Tamil: 90, English: 91, Mathematics: 92, Science: 95, SocialScience: 90 },
  ];

  const defaultExtracurricular = [
    { category: "Sports", score: 85, count: 2 },
    { category: "Clubs", score: 90, count: 3 },
    { category: "Competitions", score: 95, count: 1 },
    { category: "Engagement", score: 88, count: 4 },
  ];

  const workloadData = workload_pressure_trend.length > 0 ? workload_pressure_trend : defaultWorkloadTrend;
  const subjectData = subject_growth_trend.length > 0 ? subject_growth_trend : defaultSubjectGrowth;
  const extraData = extracurricular_analytics.length > 0 ? extracurricular_analytics : defaultExtracurricular;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Student Dashboard"
        subtitle="Real-Time Learning Health, Workload Pressure & Multi-Subject Analytics"
        actions={
          <Link
            href="/student/growth-passport"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
          >
            <span>Growth Passport</span>
            <ArrowRight size={14} />
          </Link>
        }
      />

      {/* ── Top Bento Metric Grid (Row 1) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Learning Health Index"
          value={learning_health.score}
          unit="/ 100"
          delta={learning_health.status}
          deltaType="positive"
          subtitle={`${learning_health.weak_concepts_count} weak concepts detected`}
          icon={HeartPulse}
          accentColor="var(--primary)"
        />
        <KpiCard
          title="Pending Workload"
          value={workload.pending_assignments}
          unit="assignments"
          delta={`Pressure: ${workload.pressure_level || "Moderate"}`}
          deltaType={workload.due_this_week > 2 ? "negative" : "neutral"}
          subtitle={`${workload.completed_assignments} completed total`}
          icon={Activity}
          accentColor="var(--warning)"
        />
        <KpiCard
          title="Academic GPA"
          value={academic_overview.gpa}
          unit={`Rank #${academic_overview.rank}`}
          delta={`${academic_overview.completed_credits} / ${academic_overview.total_credits} credits`}
          deltaType="positive"
          subtitle="Top 10% in class"
          icon={Award}
          accentColor="var(--info)"
        />
        <KpiCard
          title="Attendance"
          value={`${attendance.present_percentage}%`}
          unit={`${attendance.days_present}/${attendance.total_days} days`}
          delta={attendance.present_percentage >= 90 ? "Excellent" : "Needs Care"}
          deltaType={attendance.present_percentage >= 90 ? "positive" : "warning"}
          subtitle="Consistent attendance record"
          icon={Calendar}
          accentColor="var(--success)"
        />
      </div>

      {/* ── Visual Analytics Section ── */}

      {/* 1. Workload & Mental Pressure Trend Graph */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-[var(--warning)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Workload & Mental Pressure Progression
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Weekly disengagement alert radar tracking active assignments and stress levels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-[var(--success)]/15 text-[var(--success)]">Low (&lt;35)</span>
            <span className="px-2 py-0.5 rounded bg-[var(--info)]/15 text-[var(--info)]">Moderate (35-60)</span>
            <span className="px-2 py-0.5 rounded bg-[var(--warning)]/15 text-[var(--warning)]">High (60-80)</span>
            <span className="px-2 py-0.5 rounded bg-[var(--danger)]/15 text-[var(--danger)]">Overload (&gt;80)</span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workloadData}>
              <defs>
                <linearGradient id="pressureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--warning)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "10px",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="level" name="Mental Pressure Index" stroke="var(--warning)" fill="url(#pressureGrad)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="workload" name="Active Assignments" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Academic Growth & Extracurricular Graphs (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Growth Multi-Line Graph (5 Core Subjects) */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--primary)]" />
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Subject-Wise Academic Growth
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Performance trends across 5 core subjects</p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="period" stroke="var(--text-muted)" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Line type="monotone" dataKey="Tamil" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="English" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Mathematics" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Science" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="SocialScience" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extracurricular Growth Graph */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-[var(--success)]" />
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Extracurricular Growth & Participation
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Sports, Clubs, Competitions, & Engagement</p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={extraData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--text-muted)" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="score" name="Growth Index" fill="var(--success)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Growth Passport Radar Preview + AI Plan (Row 3) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Passport Radar Panel */}
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Holistic Growth Passport Preview
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                5-Axis Developmental Radar (Score: {growth_passport.holistic_score}/100)
              </p>
            </div>
            <Link
              href="/student/growth-passport"
              className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              View Full <ArrowRight size={12} />
            </Link>
          </div>
          <GrowthRadar />
          <div className="flex items-center justify-around pt-3 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <span>🏆 {growth_passport.badges_count} Badges Earned</span>
            <span>⭐ {growth_passport.achievements_count} Achievements</span>
          </div>
        </div>

        {/* AI Intelligence Study Plan Recommendation Panel */}
        <div className="flex flex-col gap-4">
          <AIInsightCard
            title="AI Workload Intelligence Suggestion"
            analysis={`Based on your active assignments and weak concept analysis in Physics, we recommend dedicating 45 minutes to Electromagnetic Induction before Thursday.\n\nYour stress index is low (Healthy 85). Optimal focus window: 4:00 PM – 6:00 PM.`}
            confidence={94}
            actions={
              <Link
                href="/student/study-plan"
                className="text-xs text-[var(--primary)] font-medium hover:underline flex items-center gap-1"
              >
                Full Study Plan <Sparkles size={12} />
              </Link>
            }
          />

          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex-1 flex flex-col justify-between shadow-sm">
            <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/student/doubts"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-accent)] transition-colors text-xs font-medium text-[var(--text-primary)]"
              >
                <div className="p-2 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="font-bold block">Ask Doubts</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Contact Teacher</span>
                </div>
              </Link>
              <Link
                href="/student/assignments"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--border-accent)] transition-colors text-xs font-medium text-[var(--text-primary)]"
              >
                <div className="p-2 rounded-lg bg-[var(--warning)]/15 text-[var(--warning)]">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <span className="font-bold block">Assignments</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Upload Submissions</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
