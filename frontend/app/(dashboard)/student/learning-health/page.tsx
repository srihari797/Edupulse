"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { LHIAreaChart } from "@/components/charts/lhi-area";
import { HeartPulse, Sparkles, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface LearningHealthData {
  score: number;
  status: string;
  completion_rate: number;
  overall_score: number;
  student_name: string;
  roll_number: string;
  weak_concepts_count: number;
  lhi_trend: Array<{ week: string; score: number }>;
  diagnostic_summary: string;
}

export default function StudentLearningHealthPage() {
  const [data, setData] = useState<LearningHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLearningHealth = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: LearningHealthData }>("/students/learning-health");
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch {
      toast.error("Failed to load Learning Health Index from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLearningHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Learning Health Index (LHI)"
        subtitle="Calculated dynamically from your actual assignment submissions, completion rates, and graded scores in PostgreSQL"
        actions={
          <button
            onClick={fetchLearningHealth}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Sparkles size={14} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Recalculating..." : "Recalculate Health Engine"}</span>
          </button>
        }
      />

      {/* ── Metric Snapshot Cards ── */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Composite LHI Score</span>
            <span className="text-2xl font-bold text-[var(--primary)] font-mono">{data.score} / 100</span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Submission Completion</span>
            <span className="text-2xl font-bold text-[var(--success)] font-mono">{data.completion_rate}%</span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Graded Average Score</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">{data.overall_score}%</span>
          </div>
        </div>
      )}

      {/* ── Area Chart Trend Panel ── */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <HeartPulse size={18} className="text-[var(--primary)]" />
              Real-Time Learning Health Index Trend
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Database-driven composite score tracking completion consistency and score progression
            </p>
          </div>
          {data && (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-[var(--success)]/15 text-[var(--success)] flex items-center gap-1">
              <ShieldCheck size={12} /> {data.status}
            </span>
          )}
        </div>

        <LHIAreaChart height={220} />
      </div>

      {/* ── AI Analysis Output ── */}
      {data ? (
        <AIInsightCard
          title="Learning Health Diagnostic Summary"
          analysis={data.diagnostic_summary}
          confidence={96}
        />
      ) : (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex items-center gap-3">
          <AlertCircle size={20} className="text-[var(--primary)] shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-semibold text-[var(--text-primary)] block">
              Calculating Database Metrics...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
