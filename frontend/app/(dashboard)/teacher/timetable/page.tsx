"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { EmptyState } from "@/components/common/states";
import { teacherService } from "@/services/teacher.service";
import type { TeacherTimetableDataDTO, TeacherTimetableSlotDTO } from "@/types/teacher.types";
import { CalendarCheck, BookOpen, Clock, Coffee, TrendingUp, Building2 } from "lucide-react";

const ORDERED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_COLORS: Record<string, string> = {
  Monday: "#5e6ad2",
  Tuesday: "#10b981",
  Wednesday: "#8b5cf6",
  Thursday: "#f59e0b",
  Friday: "#ef4444",
  Saturday: "#06b6d4",
};

export default function TeacherTimetablePage() {
  const [data, setData] = useState<TeacherTimetableDataDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await teacherService.getTimetable();
        if (res.success && res.data) {
          setData(res.data);
          const available = ORDERED_DAYS.find(d => res.data!.slots.some(s => s.day_of_week === d));
          if (available) setSelectedDay(available);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not load timetable.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Timetable" subtitle="Loading your teaching schedule..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Timetable" subtitle="Your teaching schedule" />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, slots } = data;
  const availableDays = ORDERED_DAYS.filter(d => slots.some(s => s.day_of_week === d));

  // Compute full day grid (teaching + free) for selected day
  const allPeriods = Array.from(new Set(slots.map(s => s.period_number))).sort((a, b) => a - b);
  const maxPeriod = Math.max(...allPeriods, 0);

  const dayTeachingSlots = slots
    .filter(s => s.day_of_week === selectedDay)
    .sort((a, b) => a.period_number - b.period_number);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Timetable"
        subtitle="Your complete teaching schedule across all assigned classes"
      />

      {slots.length === 0 ? (
        <EmptyState
          title="No timetable assigned"
          description="You have not been assigned to any class timetable yet. Contact your admin."
          icon={CalendarCheck}
        />
      ) : (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Today's Classes"
              value={summary.todays_classes}
              icon={CalendarCheck}
              color="#5e6ad2"
              subtitle="scheduled today"
            />
            <SummaryCard
              label="Weekly Classes"
              value={summary.weekly_classes}
              icon={TrendingUp}
              color="#10b981"
              subtitle="total this week"
            />
            <SummaryCard
              label="Free Periods"
              value={summary.free_periods}
              icon={Coffee}
              color="#f59e0b"
              subtitle="unassigned slots"
            />
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#06b6d420" }}>
                  <Building2 size={15} style={{ color: "#06b6d4" }} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)]">Assigned Classes</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.assigned_classes.length > 0 ? (
                  summary.assigned_classes.map(cls => (
                    <span key={cls} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                      {cls}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">None</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Day Picker ─────────────────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            {availableDays.map(day => {
              const color = DAY_COLORS[day] ?? "var(--primary)";
              const isActive = selectedDay === day;
              const count = slots.filter(s => s.day_of_week === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    borderColor: isActive ? color : "var(--border)",
                    background: isActive ? `${color}20` : "transparent",
                    color: isActive ? color : "var(--text-muted)",
                  }}
                >
                  {day.slice(0, 3)}
                  <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* ── Day Schedule ──────────────────────────────────────────────── */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
              {selectedDay}'s Teaching Schedule
            </h2>

            {maxPeriod === 0 ? (
              <p className="text-xs text-[var(--text-muted)] px-1">No data available.</p>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(period => {
                  const slot = dayTeachingSlots.find(s => s.period_number === period);
                  const isFree = !slot;
                  const color = slot ? (DAY_COLORS[slot.day_of_week] ?? "var(--primary)") : "var(--text-muted)";

                  return (
                    <TeacherPeriodRow key={period} period={period} slot={slot ?? null} isFree={isFree} color={color} />
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Full Weekly Grid ──────────────────────────────────────────── */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
              <BookOpen size={14} className="text-[var(--primary)]" />
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">Full Weekly Teaching Grid</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="py-2 px-4 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase">Period</th>
                    {availableDays.map(day => (
                      <th key={day} className="py-2 px-3 text-center text-[10px] font-semibold uppercase" style={{ color: DAY_COLORS[day] }}>
                        {day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(period => (
                    <tr key={period} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2 px-4 font-semibold text-[var(--text-muted)]">P{period}</td>
                      {availableDays.map(day => {
                        const slot = slots.find(s => s.day_of_week === day && s.period_number === period);
                        return (
                          <td key={day} className="py-2 px-3 text-center">
                            {slot ? (
                              <div>
                                <p className="text-[10px] font-semibold text-[var(--text-primary)]">
                                  {slot.subject_name ?? "Class"}
                                </p>
                                <p className="text-[9px] text-[var(--text-muted)]">
                                  {slot.class_name ?? `Class #${slot.class_id}`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)]/50 italic">Free</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color, subtitle,
}: {
  label: string; value: number; icon: React.ElementType; color: string; subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{subtitle}</p>
    </div>
  );
}

function TeacherPeriodRow({
  period, slot, isFree, color,
}: {
  period: number; slot: TeacherTimetableSlotDTO | null; isFree: boolean; color: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 flex items-center gap-4 transition-colors ${
        isFree
          ? "border-[var(--border)] bg-[var(--background)] opacity-60"
          : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {/* Period badge */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
        style={isFree ? { background: "var(--border)", color: "var(--text-muted)" } : { background: `${color}20`, color }}
      >
        P{period}
      </div>

      {isFree ? (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Coffee size={14} />
          <span>Free Period</span>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {slot?.class_name ?? `Class #${slot?.class_id}`}
            </p>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: `${color}15`, color }}
            >
              {slot?.subject_name ?? "Subject"}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <Clock size={10} /> {slot?.start_time} – {slot?.end_time}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
