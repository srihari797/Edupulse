"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { EmptyState } from "@/components/common/states";
import { studentService } from "@/services/student.service";
import type { StudentTimetableSlotDTO } from "@/types/student.types";
import { CalendarCheck, Clock, User, BookOpen } from "lucide-react";

const ORDERED_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_COLORS: Record<string, string> = {
  Monday: "var(--primary)",
  Tuesday: "#10b981",
  Wednesday: "#8b5cf6",
  Thursday: "#f59e0b",
  Friday: "#ef4444",
  Saturday: "#06b6d4",
};

export default function StudentTimetablePage() {
  const [slots, setSlots] = useState<StudentTimetableSlotDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await studentService.getTimetable();
        if (res.success && res.data) {
          setSlots(res.data);
          // Auto-select first available day
          const available = ORDERED_DAYS.find(d => res.data!.some(s => s.day_of_week === d));
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

  const availableDays = ORDERED_DAYS.filter(d => slots.some(s => s.day_of_week === d));
  const daySlots = slots
    .filter(s => s.day_of_week === selectedDay)
    .sort((a, b) => a.period_number - b.period_number);

  // Stats
  const totalSlots = slots.length;
  const uniqueDays = availableDays.length;
  const uniqueSubjects = new Set(slots.map(s => s.subject_id)).size;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Timetable" subtitle="Loading your class schedule..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Timetable" subtitle="Your class period schedule" />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Timetable"
        subtitle="Your read-only weekly class schedule"
      />

      {slots.length === 0 ? (
        <EmptyState
          title="No timetable published yet"
          description="Your class timetable hasn't been published by the admin yet. Check back later."
          icon={CalendarCheck}
        />
      ) : (
        <>
          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Periods/Week", value: totalSlots, icon: CalendarCheck, color: "var(--primary)" },
              { label: "School Days", value: uniqueDays, icon: BookOpen, color: "#10b981" },
              { label: "Subjects", value: uniqueSubjects, icon: BookOpen, color: "#8b5cf6" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}20` }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Day Selector ─────────────────────────────────────────────── */}
          <div className="flex gap-2 flex-wrap">
            {availableDays.map(day => {
              const color = DAY_COLORS[day] ?? "var(--primary)";
              const isActive = selectedDay === day;
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
                  {day}
                  <span className="ml-1.5 text-[10px] opacity-70">
                    ({slots.filter(s => s.day_of_week === day).length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Day Timetable ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
              {selectedDay}'s Schedule
            </h2>
            {daySlots.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] px-1">No periods on {selectedDay}.</p>
            ) : (
              <div className="space-y-2">
                {daySlots.map(slot => {
                  const color = DAY_COLORS[slot.day_of_week] ?? "var(--primary)";
                  return (
                    <div
                      key={slot.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 flex items-center gap-4 hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      {/* Period badge */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                        style={{ background: `${color}20`, color }}
                      >
                        P{slot.period_number}
                      </div>

                      {/* Subject */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {slot.subject_name ?? `Subject #${slot.subject_id}`}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {slot.teacher_name && (
                            <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                              <User size={10} /> {slot.teacher_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                            <Clock size={10} /> {slot.start_time} – {slot.end_time}
                          </span>
                        </div>
                      </div>

                      {/* Time chip */}
                      <div className="text-right shrink-0">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: `${color}15`, color }}
                        >
                          {slot.start_time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Full Weekly Overview ────────────────────────────────────────── */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
              <CalendarCheck size={14} className="text-[var(--primary)]" />
              <h3 className="text-xs font-semibold text-[var(--text-primary)]">Weekly Overview</h3>
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
                  {Array.from(new Set(slots.map(s => s.period_number))).sort((a, b) => a - b).map(period => (
                    <tr key={period} className="hover:bg-[var(--surface-hover)]">
                      <td className="py-2 px-4 font-semibold text-[var(--text-muted)]">P{period}</td>
                      {availableDays.map(day => {
                        const slot = slots.find(s => s.day_of_week === day && s.period_number === period);
                        return (
                          <td key={day} className="py-2 px-3 text-center">
                            {slot ? (
                              <span className="text-[10px] font-medium text-[var(--text-primary)]">
                                {slot.subject_name ?? `Subj #${slot.subject_id}`}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)]">—</span>
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
