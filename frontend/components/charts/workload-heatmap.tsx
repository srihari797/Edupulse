"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HeatmapDay {
  date: string;
  dayName: string;
  load: number; // 0 = free, 1 = low, 2 = medium, 3 = high, 4 = critical
  assignmentsCount: number;
}

interface WorkloadHeatmapProps {
  days?: HeatmapDay[];
  onDayClick?: (day: HeatmapDay) => void;
  className?: string;
}

const DEFAULT_DAYS: HeatmapDay[] = [
  { date: "2026-07-21", dayName: "Mon", load: 1, assignmentsCount: 1 },
  { date: "2026-07-22", dayName: "Tue", load: 0, assignmentsCount: 0 },
  { date: "2026-07-23", dayName: "Wed", load: 2, assignmentsCount: 2 },
  { date: "2026-07-24", dayName: "Thu", load: 4, assignmentsCount: 4 },
  { date: "2026-07-25", dayName: "Fri", load: 3, assignmentsCount: 3 },
  { date: "2026-07-26", dayName: "Sat", load: 0, assignmentsCount: 0 },
  { date: "2026-07-27", dayName: "Sun", load: 1, assignmentsCount: 1 },
];

const loadColors: Record<number, string> = {
  0: "bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)]",
  1: "bg-[var(--primary)]/20 border-[var(--primary)]/40 text-[var(--primary)]",
  2: "bg-[var(--warning)]/25 border-[var(--warning)]/40 text-[var(--warning)]",
  3: "bg-[var(--warning)]/60 border-[var(--warning)] text-white shadow-sm",
  4: "bg-[var(--danger)] border-[var(--danger)] text-white shadow-md shadow-[var(--danger)]/20",
};

/**
 * WorkloadHeatmap — GitHub-style stress calendar heatmap block array with Framer Motion hover effects.
 */
export function WorkloadHeatmap({
  days = DEFAULT_DAYS,
  onDayClick,
  className,
}: WorkloadHeatmapProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
        <span className="font-medium text-[var(--text-secondary)]">Weekly Stress Load Grid</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Free</span>
          <span className="w-2.5 h-2.5 rounded bg-[var(--surface-hover)] border border-[var(--border)]" />
          <span className="w-2.5 h-2.5 rounded bg-[var(--primary)]/30" />
          <span className="w-2.5 h-2.5 rounded bg-[var(--warning)]/50" />
          <span className="w-2.5 h-2.5 rounded bg-[var(--danger)]" />
          <span>Heavy</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2.5">
        {days.map((d) => {
          const colorClass = loadColors[d.load] ?? loadColors[0];
          return (
            <motion.button
              key={d.date}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.12 }}
              onClick={() => onDayClick?.(d)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-shadow cursor-pointer",
                colorClass
              )}
              title={`${d.dayName} (${d.date}): ${d.assignmentsCount} assignments due`}
            >
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-80">
                {d.dayName}
              </span>
              <span className="metric text-base font-bold mt-1">
                {d.assignmentsCount}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
