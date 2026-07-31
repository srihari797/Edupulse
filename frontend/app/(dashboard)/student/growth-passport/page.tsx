"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { GrowthRadar } from "@/components/charts/growth-radar";
import { SkeletonCard, SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { Badge } from "@/components/common/badge";
import { useGrowthPassport } from "@/hooks/student/use-growth-passport";
import { Trophy, Medal, Star, Clock, Sparkles } from "lucide-react";

export default function GrowthPassportPage() {
  const { passport, recognition, isLoading, error, refetch } = useGrowthPassport();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Growth Passport" subtitle="Loading your holistic development records..." />
        <SkeletonCard />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div>
        <PageHeader title="Growth Passport" subtitle="Holistic Student Growth & Recognition" />
        <ErrorState
          title="Could not load Growth Passport"
          message={error || "Ensure backend is running."}
          onRetry={refetch}
        />
      </div>
    );
  }

  const { holistic_score, growth_level, achievements, activities } = passport;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Holistic Student Growth Passport"
        subtitle={`Overall Developmental Level: ${growth_level} • Score: ${holistic_score}/100`}
        actions={
          <Badge variant="primary" className="px-3 py-1 text-xs">
            <Sparkles size={12} className="mr-1 inline" /> Level: {growth_level}
          </Badge>
        }
      />

      {/* ── Top Layout: Interactive Radar + Score Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                5-Axis Developmental Radar
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Cognitive, Social-Emotional, Physical, Extra-curricular, Ethics
              </p>
            </div>
            <span className="metric text-xl font-bold text-[var(--primary)]">
              {holistic_score} <span className="text-xs text-[var(--text-muted)]">/100</span>
            </span>
          </div>
          <GrowthRadar />
        </div>

        {/* Holistic Score Breakdown Panel */}
        <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Development Snapshot
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Proactive holistic growth indicators verified by AI engine.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)]">Total Achievements</span>
              <span className="metric text-sm font-bold text-[var(--text-primary)]">
                {achievements.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)]">Active Activities</span>
              <span className="metric text-sm font-bold text-[var(--text-primary)]">
                {activities.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-[var(--background)] border border-[var(--border)]">
              <span className="text-xs text-[var(--text-secondary)]">Recognitions & Badges</span>
              <span className="metric text-sm font-bold text-[var(--success)]">
                {recognition?.recent_achievements?.length ?? achievements.length}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            * Scores update automatically as assignment submissions, extracurricular hours, and teacher commendations are logged.
          </p>
        </div>
      </div>

      {/* ── Badges & Achievements Grid ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Trophy size={16} className="text-[var(--warning)]" />
          Earned Badges & Recognitions
        </h3>

        {achievements.length === 0 ? (
          <EmptyState
            title="No badges earned yet"
            description="Complete assignments and participate in extracurricular activities to unlock badges."
            icon={Medal}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.15 }}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-start gap-3"
              >
                <div className="p-2.5 rounded-lg bg-[var(--warning)]/10 text-[var(--warning)] shrink-0">
                  <Star size={18} fill="currentColor" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                    {item.description || "Earned for high performance"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {item.category}
                    </Badge>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {item.date_earned}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Extracurricular Activities Log ── */}
      <div className="space-y-3 pt-4 border-t border-[var(--border)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Clock size={16} className="text-[var(--primary)]" />
          Extracurricular Activities & Time Log
        </h3>

        {activities.length === 0 ? (
          <EmptyState
            title="No activities recorded"
            description="Log your club participation, sports, or volunteer hours."
          />
        ) : (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {activities.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">
                      {act.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {act.description || "Active participant"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="info">{act.activity_type}</Badge>
                    <span className="metric text-xs font-semibold text-[var(--text-primary)] bg-[var(--background)] px-2.5 py-1 rounded border border-[var(--border)]">
                      {act.hours_spent} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
