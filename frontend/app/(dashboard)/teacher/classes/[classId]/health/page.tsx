"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceBarChart } from "@/components/charts/performance-bar";
import { SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/common/badge";
import { teacherService } from "@/services/teacher.service";
import type { ClassroomHealthDTO } from "@/types/teacher.types";
import { HeartPulse, ArrowRight, BookOpen } from "lucide-react";

export default function ClassroomHealthPage() {
  const [health, setHealth] = useState<ClassroomHealthDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teacherService
      .getClassroomHealth(10)
      .then((res) => {
        if (res.success && res.data) setHealth(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Classroom Health" subtitle="Loading analytics..." />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !health) {
    return (
      <div>
        <PageHeader title="Classroom Health" subtitle="Academic Progression Diagnostics" />
        <ErrorState title="Could not load classroom health" message={error || undefined} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Classroom Health — ${health.class_name}`}
        subtitle="Performance distribution, topic mastery gaps, and class metrics"
      />

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">Class Average GPA</span>
            <p className="metric text-2xl font-bold text-[var(--text-primary)] mt-0.5">
              {health.average_gpa} / 4.0
            </p>
          </div>
          <HeartPulse size={24} className="text-[var(--primary)] opacity-80" />
        </div>

        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--text-secondary)]">Average Attendance</span>
            <p className="metric text-2xl font-bold text-[var(--success)] mt-0.5">
              {health.average_attendance}%
            </p>
          </div>
          <BookOpen size={24} className="text-[var(--success)] opacity-80" />
        </div>
      </div>

      {/* Performance Bar Chart Panel */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Grade Performance Distribution
        </h3>
        <PerformanceBarChart height={220} />
      </div>

      {/* Weak Topics Tag List */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Identified Weak Mastery Concepts
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Topics where more than 35% of the classroom scored under benchmark:
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {health.weak_topics.map((topic, i) => (
            <Badge key={i} variant="warning" className="px-3 py-1 text-xs">
              {topic}
            </Badge>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Link
          href="/teacher/students/1/learning-dna"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:underline"
        >
          Inspect Individual Student Learning DNA <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
