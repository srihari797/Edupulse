"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/cards/kpi-card";
import { SkeletonGrid } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { StatusDot } from "@/components/common/status-dot";
import { useAdminDashboard } from "@/hooks/admin/use-admin-dashboard";
import {
  Users,
  Building2,
  AlertTriangle,
  ShieldCheck,
  GraduationCap,
  BookMarked,
  CalendarCheck,
  Settings,
  Radar,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Control Panel" subtitle="Loading institutional overview..." />
        <SkeletonGrid count={4} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Admin Control Panel" subtitle="Institutional Overview" />
        <ErrorState
          title="Could not load admin dashboard"
          message={error || "Ensure backend is running."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const { student_count, teacher_count, class_count, system_status, active_alerts_count } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Admin Control Panel — Institutional Overview"
        subtitle="School-wide user management, academic configuration, and AI risk radar"
        actions={
          <Link
            href="/admin/ai-radar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Radar size={14} />
            <span>AI Student Radar</span>
          </Link>
        }
      />

      {/* Top Macro KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={student_count}
          unit="enrolled"
          delta="Active Year"
          deltaType="positive"
          subtitle="Enrolled across all classes"
          icon={GraduationCap}
          accentColor="var(--primary)"
        />
        <KpiCard
          title="Total Faculty / Teachers"
          value={teacher_count}
          unit="teachers"
          delta="Staff Active"
          deltaType="neutral"
          subtitle="Assigned to subjects"
          icon={Users}
          accentColor="var(--info)"
        />
        <KpiCard
          title="Active Classes & Sections"
          value={class_count}
          unit="classrooms"
          delta="Timetable Operational"
          deltaType="positive"
          subtitle="Grades 1 through 12"
          icon={Building2}
          accentColor="var(--warning)"
        />
        <KpiCard
          title="Active System Risk Alerts"
          value={active_alerts_count}
          unit="flagged"
          delta={active_alerts_count > 0 ? "Requires Attention" : "Optimal"}
          deltaType={active_alerts_count > 0 ? "negative" : "positive"}
          subtitle="Disengagement signals"
          icon={AlertTriangle}
          accentColor="var(--danger)"
        />
      </div>

      {/* System Status Banner Card */}
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status="active" />
          <div>
            <h3 className="text-xs font-semibold text-[var(--text-primary)]">
              Institutional System Status: {system_status}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              All FastAPI services, JWT authentication, and AI inference engines operating normally.
            </p>
          </div>
        </div>
        <span className="metric text-xs font-mono text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2.5 py-1 rounded">
          Operational
        </span>
      </div>

      {/* Administrative Quick Action Tiles */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Administrative Control Modules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: "User Management", desc: "Create, edit, and reset passwords for all roles", href: "/admin/users", icon: Users, color: "var(--primary)" },
            { title: "Student Management", desc: "Map students to classes & link parent accounts", href: "/admin/student-management", icon: GraduationCap, color: "var(--success)" },
            { title: "Classes & Sections", desc: "Configure grade sections and room capacities", href: "/admin/classes", icon: Building2, color: "var(--warning)" },
            { title: "Academics & Subjects", desc: "Manage subject codes and teacher assignments", href: "/admin/academics", icon: BookMarked, color: "var(--info)" },
            { title: "Timetable & Schedules", desc: "Set up period slots and classroom schedules", href: "/admin/timetable", icon: CalendarCheck, color: "var(--primary)" },
            { title: "System Settings", desc: "Manage institutional configuration key-values", href: "/admin/settings", icon: Settings, color: "var(--text-secondary)" },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                href={tile.href}
                className="group p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-accent)] transition-colors flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded bg-[var(--surface-hover)] shrink-0"
                    style={{ color: tile.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                      {tile.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                      {tile.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end text-[11px] font-medium text-[var(--primary)] pt-1">
                  <span>Manage</span>
                  <ArrowRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
