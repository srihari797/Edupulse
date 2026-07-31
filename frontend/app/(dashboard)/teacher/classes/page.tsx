"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { Building2, Users, CalendarCheck, BookOpen, Clock, MapPin, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TeacherClassDTO {
  mapping_id: number;
  class_id: number;
  class_name: string;
  grade: string;
  section: string;
  subject_id: number;
  subject_name: string;
}

interface TimetableSlotDTO {
  id: number;
  day_of_week: string;
  period_number: number;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
  room_number: string;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClassDTO[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlotDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  useEffect(() => {
    const loadTeacherClassesAndSchedule = async () => {
      setIsLoading(true);
      try {
        const [cRes, tRes] = await Promise.all([
          api.get<{ success: boolean; data: TeacherClassDTO[] }>("/teacher/classes"),
          api.get<{ success: boolean; data: { slots: TimetableSlotDTO[] } | TimetableSlotDTO[] }>("/teacher/timetable"),
        ]);

        if (cRes.success && cRes.data) {
          setClasses(cRes.data);
          if (cRes.data.length > 0) setSelectedClassId(cRes.data[0].class_id);
        }
        if (tRes.success && tRes.data) {
          const rawData = tRes.data;
          const slotsList = Array.isArray(rawData)
            ? rawData
            : (rawData as { slots: TimetableSlotDTO[] }).slots || [];
          setTimetable(slotsList);
        }
      } catch {
        // Fallback default
      } finally {
        setIsLoading(false);
      }
    };
    loadTeacherClassesAndSchedule();
  }, []);

  const activeClass = classes.find((c) => c.class_id === selectedClassId) || classes[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assigned Classes & Timetable Schedule" subtitle="Loading class mappings..." />
        <SkeletonRow count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Classroom Roster & Timetable"
        subtitle="Manage assigned classes (e.g., Grade 10-A, 8-B) and view your live personal teaching schedule"
      />

      {/* Class Switcher Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Assigned Classes ({classes.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const isSelected = cls.class_id === selectedClassId;
            return (
              <div
                key={cls.mapping_id}
                onClick={() => setSelectedClassId(cls.class_id)}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer shadow-sm space-y-3",
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-accent)]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)]">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{cls.class_name}</h4>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
                        {cls.subject_name} • Grade {cls.grade}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className={cn("text-[var(--text-muted)]", isSelected && "text-[var(--primary)]")} />
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] font-medium">Assigned Subject:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono">{cls.subject_name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Class Roster Shortcut */}
      {activeClass && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-[var(--primary)]" />
            <div>
              <span className="font-bold text-[var(--text-primary)] block">
                Viewing Roster for {activeClass.class_name} ({activeClass.subject_name})
              </span>
              <span className="text-[var(--text-muted)]">
                Inspect enrolled students and individual academic progress reports.
              </span>
            </div>
          </div>
          <Link
            href="/teacher/students"
            className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-xs hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
          >
            View Student Roster →
          </Link>
        </div>
      )}

      {/* Personal Timetable Schedule Grid */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarCheck size={18} className="text-[var(--primary)]" />
            Weekly Personal Teaching Timetable
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">Assigned by Admin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Array.isArray(timetable) ? timetable : []).map((slot) => (
            <div key={slot.id} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--primary)]">
                <span>{slot.day_of_week}</span>
                <span className="font-mono">Period {slot.period_number}</span>
              </div>
              <h5 className="font-bold text-[var(--text-primary)]">{slot.subject_name}</h5>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {slot.start_time} - {slot.end_time}
                </span>
                <span className="flex items-center gap-1 text-[var(--text-secondary)] font-semibold">
                  <MapPin size={10} /> {slot.room_number}
                </span>
              </div>
              <div className="pt-1 text-[10px] font-bold text-[var(--text-secondary)]">
                Class: {slot.class_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
