"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RiskCard } from "@/components/cards/risk-card";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { useRiskAlerts } from "@/hooks/teacher/use-risk-alerts";
import { AlertTriangle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TeacherRiskAlertsPage() {
  const { alerts, isLoading, error, refetch } = useRiskAlerts(10);
  const [filterLevel, setFilterLevel] = useState<"All" | "High" | "Medium" | "Low">("All");

  const filteredAlerts = alerts.filter((a) => {
    if (filterLevel === "All") return true;
    return a.risk_level === filterLevel;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Risk Alert Radar" subtitle="Loading disengagement alerts..." />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Risk Alert Radar" subtitle="Classroom Disengagement Early Warning System" />
        <ErrorState title="Could not load risk alerts" message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disengagement Risk Alert Radar"
        subtitle="AI-detected early warning signals for students showing declining performance or attendance drops"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <Filter size={14} className="text-[var(--text-muted)] mr-1" />
        {(["All", "High", "Medium", "Low"] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(lvl)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              filterLevel === lvl
                ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {lvl} Risk
          </button>
        ))}
      </div>

      {/* Grid List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          title="No risk alerts flagged"
          description="There are currently no students matching this risk level filter."
          icon={AlertTriangle}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => (
            <RiskCard
              key={alert.student_id}
              studentName={alert.student_name}
              riskLevel={alert.risk_level}
              reason={alert.reason}
              metricTriggered={alert.metric_triggered}
              alertDate={alert.alert_date}
              actions={
                <Link
                  href={`/teacher/students/${alert.student_id}/learning-dna`}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  View Learning DNA →
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
