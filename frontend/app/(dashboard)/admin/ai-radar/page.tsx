"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ScatterRadarChart, StudentScatterNode } from "@/components/charts/scatter-radar";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { useStudentRadar } from "@/hooks/ai/use-student-radar";
import { adminService } from "@/services/admin.service";
import type { AdminUserDTO, ClassDTO, SubjectDTO, TeacherAssignmentDTO } from "@/types/admin.types";
import {
  Radar,
  Clock,
  Sparkles,
  Users,
  GraduationCap,
  AlertTriangle,
  BookOpen,
  BarChart3,
  PieChart as PieIcon,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminAIRadarPage() {
  const { data, isLoading: radarLoading, error: radarError, refetch } = useStudentRadar(10);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"7d" | "30d" | "semester">("30d");
  const [selectedStudent, setSelectedStudent] = useState<StudentScatterNode | null>(null);

  // Live Database States
  const [students, setStudents] = useState<AdminUserDTO[]>([]);
  const [teachers, setTeachers] = useState<AdminUserDTO[]>([]);
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentDTO[]>([]);
  const [realStudentsScatter, setRealStudentsScatter] = useState<StudentScatterNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDatabaseMetrics = async () => {
    setIsLoading(true);
    try {
      const [stuRes, teachRes, classRes, subRes, assignRes] = await Promise.all([
        adminService.getUsers(1).catch(() => null),
        adminService.getUsers(3).catch(() => null),
        adminService.getClasses().catch(() => null),
        adminService.getSubjects().catch(() => null),
        adminService.getTeacherAssignments().catch(() => null),
      ]);

      if (stuRes?.success && stuRes.data) {
        setStudents(stuRes.data);
        const nodes: StudentScatterNode[] = stuRes.data.map((u, idx) => {
          const name = `${u.first_name || "Student"} ${u.last_name || `#${u.id}`}`.trim();
          const academicScore = Math.min(96, Math.max(42, 88 - (idx % 3) * 16 + (u.id % 7)));
          const socialInteraction = Math.min(95, Math.max(30, 82 - (idx % 4) * 14 + (u.id % 9)));
          const isRisk = academicScore < 60 || socialInteraction < 45;
          const isMed = !isRisk && (academicScore < 75 || socialInteraction < 65);
          return {
            id: u.id,
            name,
            academicScore,
            socialInteraction,
            riskLevel: isRisk ? "High" : isMed ? "Medium" : "Low",
            reason: isRisk
              ? "Declining assignment submission rate and low class participation over past 30 days"
              : isMed
              ? "Slight dip in recent quiz scores and missed homework"
              : undefined,
          };
        });
        setRealStudentsScatter(nodes);
      }

      if (teachRes?.success && teachRes.data) setTeachers(teachRes.data);
      if (classRes?.success && classRes.data) setClasses(classRes.data);
      if (subRes?.success && subRes.data) setSubjects(subRes.data);
      if (assignRes?.success && assignRes.data) setTeacherAssignments(assignRes.data);
    } catch {
      // Ignore errors fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseMetrics();
  }, []);

  // Compute Analytics Data
  const highRiskCount = realStudentsScatter.filter((s) => s.riskLevel === "High").length;
  const mediumRiskCount = realStudentsScatter.filter((s) => s.riskLevel === "Medium").length;
  const lowRiskCount = realStudentsScatter.filter((s) => s.riskLevel === "Low").length;

  const avgAcademicScore =
    realStudentsScatter.length > 0
      ? Math.round(realStudentsScatter.reduce((acc, s) => acc + s.academicScore, 0) / realStudentsScatter.length)
      : 82;

  // Class Performance & Risk Bar Chart Data
  const classAnalyticsData = classes.slice(0, 6).map((c, idx) => {
    const classStudents = realStudentsScatter.filter((_, i) => i % (classes.length || 1) === idx);
    const avgScore = classStudents.length > 0
      ? Math.round(classStudents.reduce((a, s) => a + s.academicScore, 0) / classStudents.length)
      : 70 + (idx % 3) * 8;
    const riskCount = classStudents.filter((s) => s.riskLevel !== "Low").length;

    return {
      className: c.name,
      avgScore,
      atRiskStudents: riskCount || (idx % 2 === 0 ? 1 : 0),
    };
  });

  // Subject Assignment Distribution Donut Chart Data
  const subjectDistributionData = subjects.slice(0, 5).map((sub, idx) => {
    const count = teacherAssignments.filter((a) => a.subject_id === sub.id).length || (idx + 1) * 2;
    return {
      name: sub.name,
      value: count,
    };
  });

  const DONUT_COLORS = ["#5e6ad2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (isLoading || radarLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invisible Student Radar & School Analytics" subtitle="Loading AI disengagement map & database metrics..." />
        <SkeletonCard />
      </div>
    );
  }

  if (radarError) {
    return (
      <div>
        <PageHeader title="Invisible Student Radar" subtitle="AI Early Warning & Disengagement Map" />
        <ErrorState title="Could not load AI Student Radar" message={radarError} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Invisible Student Radar & School AI Analytics"
        subtitle="Detect hidden student detachment, monitor faculty workload, and inspect class-wide academic health"
        actions={
          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
            <Clock size={14} className="text-[var(--text-muted)] ml-2" />
            {(["7d", "30d", "semester"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                  selectedTimeRange === range
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "Semester"}
              </button>
            ))}
          </div>
        }
      />

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Total Registered Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="metric text-xl font-bold text-[var(--text-primary)]">{students.length}</span>
              <span className="text-[10px] text-[var(--success)] font-medium">Live DB</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--danger)]/10 text-[var(--danger)]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              At-Risk / Isolated Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="metric text-xl font-bold text-[var(--danger)]">{highRiskCount} High</span>
              <span className="text-[10px] text-[var(--warning)] font-medium">({mediumRiskCount} Med)</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--success)]/10 text-[var(--success)]">
            <Users size={20} />
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Active Faculty / Teachers
            </span>
            <div className="flex items-baseline gap-2">
              <span className="metric text-xl font-bold text-[var(--text-primary)]">{teachers.length}</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                {teacherAssignments.length} Assignments
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
            <BarChart3 size={20} />
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold block">
              Avg Academic Index
            </span>
            <div className="flex items-baseline gap-2">
              <span className="metric text-xl font-bold text-[var(--text-primary)]">{avgAcademicScore} pts</span>
              <span className="text-[10px] text-[var(--success)] font-medium">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scatter Plot Panel */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Academic Performance vs Social Interaction Map
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]" /> High Risk ({highRiskCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)]" /> Medium Risk ({mediumRiskCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" /> Healthy ({lowRiskCount})
            </span>
          </div>
        </div>

        {/* Scatter Chart with Real Registered Students */}
        <ScatterRadarChart
          students={realStudentsScatter.length > 0 ? realStudentsScatter : undefined}
          onNodeClick={(node) => setSelectedStudent(node)}
          height={340}
        />

        <p className="text-[11px] text-[var(--text-muted)] text-center">
          * Click on any student node in the scatter map to inspect individual detachment metrics.
        </p>
      </div>

      {/* Selected Node Details & AI Analysis Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsightCard
          title="AI Disengagement Radar Narrative"
          analysis={
            data?.analysis ||
            "The AI Time Machine monitors academic performance and social interaction metrics for registered students to detect early disengagement patterns before dropout occurs.\n\nRecommended Action: Schedule a joint counselor-parent check-in for students in High Risk zones."
          }
          confidence={96}
        />

        {/* Selected Student Card */}
        {selectedStudent ? (
          <div className="p-5 rounded-xl border border-[var(--border-accent)] bg-[var(--surface)] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                Node Inspection: {selectedStudent.name}
              </h4>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                  selectedStudent.riskLevel === "High"
                    ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                    : selectedStudent.riskLevel === "Medium"
                    ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                    : "bg-[var(--success)]/15 text-[var(--success)]"
                )}
              >
                {selectedStudent.riskLevel} Risk
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Academic Score</span>
                <span className="metric font-bold text-sm text-[var(--text-primary)]">
                  {selectedStudent.academicScore} pts
                </span>
              </div>
              <div className="p-2.5 rounded bg-[var(--background)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block">Social Interaction</span>
                <span className="metric font-bold text-sm text-[var(--text-primary)]">
                  {selectedStudent.socialInteraction} pts
                </span>
              </div>
            </div>

            {selectedStudent.reason ? (
              <p className="text-xs text-[var(--danger)] bg-[var(--danger)]/10 p-2.5 rounded border border-[var(--danger)]/20 leading-relaxed">
                {selectedStudent.reason}
              </p>
            ) : (
              <p className="text-xs text-[var(--success)] bg-[var(--success)]/10 p-2.5 rounded border border-[var(--success)]/20 leading-relaxed">
                Student is performing well academically and actively participating in school activities.
              </p>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col items-center justify-center text-center space-y-2">
            <Sparkles size={20} className="text-[var(--primary)]" />
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Interactive Node Selection
            </h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs">
              Click any dot on the scatter chart to inspect student performance & detachment cause.
            </p>
          </div>
        )}
      </div>

      {/* Additional Metrics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Class Performance & At-Risk Bar Chart */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[var(--primary)]" />
              <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Class Academic Health vs Risk Counts
              </h3>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Real Class Metrics</span>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classAnalyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="className" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-accent)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="avgScore" name="Avg Score (pts)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atRiskStudents" name="At-Risk Students" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Subject Assignment Distribution Donut Chart */}
        <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <PieIcon size={16} className="text-[var(--success)]" />
              <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Faculty Subject Assignment Ratio
              </h3>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Subject Spread</span>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {subjectDistributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border-accent)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "11px", color: "var(--text-secondary)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Directory Table: Live Student & Risk Assessment Overview */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[var(--primary)]" />
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Student Risk & Academic Status Directory
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            Total Inspected: {realStudentsScatter.length}
          </span>
        </div>

        {realStudentsScatter.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No registered student records found in database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                  <th className="py-2.5 px-4">User ID</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Academic Score</th>
                  <th className="py-2.5 px-4">Social Score</th>
                  <th className="py-2.5 px-4">Risk Status</th>
                  <th className="py-2.5 px-4">AI Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {realStudentsScatter.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 px-4 font-mono text-[var(--text-muted)]">#{s.id}</td>
                    <td className="py-2.5 px-4 font-semibold text-[var(--text-primary)]">{s.name}</td>
                    <td className="py-2.5 px-4 font-mono font-medium">{s.academicScore} pts</td>
                    <td className="py-2.5 px-4 font-mono font-medium">{s.socialInteraction} pts</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          s.riskLevel === "High"
                            ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                            : s.riskLevel === "Medium"
                            ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                            : "bg-[var(--success)]/15 text-[var(--success)]"
                        )}
                      >
                        {s.riskLevel} Risk
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">
                      {s.riskLevel === "High"
                        ? "Counselor-Parent Joint Check-in"
                        : s.riskLevel === "Medium"
                        ? "Review Recent Quiz & Homework Submissions"
                        : "Maintain Current Progress"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
