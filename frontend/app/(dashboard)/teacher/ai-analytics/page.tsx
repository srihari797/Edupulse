"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AIInsightCard } from "@/components/cards/ai-insight-card";
import { PerformanceBarChart } from "@/components/charts/performance-bar";
import { BrainCircuit, Sparkles, CheckCircle2, ShieldCheck, Zap, AlertTriangle, ShieldAlert, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface AIAnalyticsResponse {
  ai_provider_active: boolean;
  provider_name: string;
  workload_intelligence: {
    class_mastery_index: number;
    recommended_focus_area: string;
    predicted_pass_rate: number;
    student_cohort_size: number;
  };
  insights: Array<{
    title: string;
    content: string;
    category: string;
  }>;
}

interface RiskAlertItem {
  student_id: number;
  student_name: string;
  risk_level: string;
  reason: string;
  metric_triggered: string;
  alert_date: string;
  ai_recommendation?: string;
}

export default function TeacherAIAnalyticsPage() {
  const [data, setData] = useState<AIAnalyticsResponse | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAIAnalytics = async () => {
    setIsLoading(true);
    try {
      const [res, riskRes] = await Promise.all([
        api.get<{ success: boolean; data: AIAnalyticsResponse }>("/teacher/ai-analytics"),
        api.get<{ success: boolean; data: RiskAlertItem[] }>("/teacher/risk-alerts").catch(() => null)
      ]);
      if (res.success && res.data) {
        setData(res.data);
      }
      if (riskRes?.success && Array.isArray(riskRes.data)) {
        setRiskAlerts(riskRes.data);
      }
    } catch {
      toast.error("Failed to load AI analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Classroom AI Analytics & Workload Intelligence"
        subtitle="Real-time AI diagnostic recommendations, concept mastery trends, and Invisible Student Risk Radar"
        actions={
          <button
            onClick={fetchAIAnalytics}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Sparkles size={14} className={isLoading ? "animate-spin" : ""} />
            <span>{isLoading ? "Analyzing..." : "Re-compile AI Intelligence"}</span>
          </button>
        }
      />

      {/* Provider Status Banner */}
      {data && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)]">
              <BrainCircuit size={20} />
            </div>
            <div>
              <span className="font-bold text-xs text-[var(--text-primary)] block">
                Engine Status: {data.provider_name}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {data.ai_provider_active
                  ? "Live Groq Cloud API (LLaMA 3.3 70B) active"
                  : "Running on Real PostgreSQL Student Metrics"}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--success)]/15 text-[var(--success)] flex items-center gap-1">
            <Zap size={10} /> Ready
          </span>
        </div>
      )}

      {/* Workload Intelligence KPI Grid */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Class Mastery Index</span>
            <span className="text-2xl font-bold text-[var(--primary)] font-mono">{data.workload_intelligence.class_mastery_index}%</span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Predicted Pass Rate</span>
            <span className="text-2xl font-bold text-[var(--success)] font-mono">{data.workload_intelligence.predicted_pass_rate}%</span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center">
            <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] block">Analyzed Cohort Size</span>
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">{data.workload_intelligence.student_cohort_size} Students</span>
          </div>
        </div>
      )}

      {/* 🔴 Invisible Student Risk Detection Radar Table */}
      {riskAlerts.length > 0 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} className="text-[var(--danger)]" />
              Invisible Student Risk Radar ({riskAlerts.length} Flagged)
            </h3>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Early warning detection for disengagement & score drops
            </span>
          </div>

          <div className="space-y-3">
            {riskAlerts.map((alert) => (
              <div
                key={alert.student_id}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[var(--text-primary)]">{alert.student_name}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">#{alert.student_id}</span>
                  </div>

                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      alert.risk_level === "High"
                        ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                        : alert.risk_level === "Medium"
                        ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                        : "bg-[var(--success)]/15 text-[var(--success)]"
                    )}
                  >
                    {alert.risk_level} Risk • {alert.metric_triggered}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  Trigger Cause: <span className="text-[var(--text-primary)]">{alert.reason}</span>
                </p>

                {alert.ai_recommendation && (
                  <div className="p-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/25 space-y-1">
                    <span className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1.5">
                      <Sparkles size={12} /> AI Recommended Teacher Action:
                    </span>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                      {alert.ai_recommendation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classroom Mastery Bar Chart */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit size={16} className="text-[var(--primary)]" />
          Classroom Mastery & Score Distribution
        </h3>
        <PerformanceBarChart height={220} />
      </div>

      {/* Diagnostic Insight Cards */}
      {data?.insights.map((insight, idx) => (
        <AIInsightCard
          key={idx}
          title={insight.title}
          analysis={insight.content}
          confidence={94}
        />
      ))}
    </div>
  );
}
