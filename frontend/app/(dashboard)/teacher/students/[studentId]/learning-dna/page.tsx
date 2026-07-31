"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { Badge } from "@/components/common/badge";
import { teacherService } from "@/services/teacher.service";
import type { LearningDNADTO } from "@/types/teacher.types";
import { Brain, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

export default function StudentLearningDNAPage() {
  const [dna, setDna] = useState<LearningDNADTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    teacherService
      .getLearningDNA(1)
      .then((res) => {
        if (res.success && res.data) setDna(res.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Learning DNA" subtitle="Loading cognitive profile..." />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !dna) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="Learning DNA" subtitle="Student Cognitive & Learning Profile" />
        <ErrorState title="Could not load Learning DNA" message={error || undefined} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={`Student Learning DNA — ${dna.student_name}`}
        subtitle="Cognitive profile metrics, strengths, improvement areas, and tailored teaching strategies"
      />

      {/* Strengths & Improvement Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <h3 className="text-xs font-semibold text-[var(--success)] uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 size={16} />
            Identified Cognitive Strengths
          </h3>
          <div className="space-y-2">
            {dna.strengths.map((str, idx) => (
              <div key={idx} className="p-2.5 rounded bg-[var(--success)]/10 border border-[var(--success)]/20 text-xs text-[var(--text-primary)] font-medium">
                • {str}
              </div>
            ))}
          </div>
        </div>

        {/* Improvement Areas */}
        <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <h3 className="text-xs font-semibold text-[var(--warning)] uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={16} />
            Target Improvement Areas
          </h3>
          <div className="space-y-2">
            {dna.improvement_areas.map((area, idx) => (
              <div key={idx} className="p-2.5 rounded bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-xs text-[var(--text-primary)] font-medium">
                • {area}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Pedagogical Strategies */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Lightbulb size={16} className="text-[var(--primary)]" />
          Recommended Pedagogical Strategies
        </h3>
        <div className="space-y-3">
          {dna.recommended_strategies.map((strat, idx) => (
            <div key={idx} className="p-3 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] leading-relaxed">
              <span className="font-semibold text-[var(--primary)] mr-2">Strategy #{idx + 1}:</span>
              {strat}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
