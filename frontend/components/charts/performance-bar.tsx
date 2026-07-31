"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface PerformanceBarData {
  gradeBucket: string; // e.g. "90-100%", "80-89%", "70-79%", "<70%"
  studentCount: number;
  color?: string;
}

interface PerformanceBarProps {
  data?: PerformanceBarData[];
  height?: number;
}

const DEFAULT_BAR_DATA: PerformanceBarData[] = [
  { gradeBucket: "90-100% (A)", studentCount: 8, color: "#10b981" },
  { gradeBucket: "80-89% (B)", studentCount: 12, color: "#5e6ad2" },
  { gradeBucket: "70-79% (C)", studentCount: 5, color: "#f59e0b" },
  { gradeBucket: "< 70% (Risk)", studentCount: 3, color: "#ef4444" },
];

/**
 * PerformanceBarChart — Recharts BarChart with semantic grade colors, rounded corners, and interactive tooltips.
 */
export function PerformanceBarChart({
  data = DEFAULT_BAR_DATA,
  height = 220,
}: PerformanceBarProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
          <XAxis
            dataKey="gradeBucket"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as PerformanceBarData;
                return (
                  <div className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-accent)] shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color ?? "#5e6ad2" }} />
                      <span className="metric font-bold text-sm text-[var(--text-primary)]">
                        {item.studentCount} Students
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="studentCount" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color ?? "#5e6ad2"} opacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
