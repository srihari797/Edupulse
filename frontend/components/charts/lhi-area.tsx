"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface LHIAreaDataPoint {
  date: string;
  score: number;
}

interface LHIAreaChartProps {
  data?: LHIAreaDataPoint[];
  color?: string;
  height?: number;
}

const DEFAULT_LHI_DATA: LHIAreaDataPoint[] = [
  { date: "Week 1", score: 72 },
  { date: "Week 2", score: 75 },
  { date: "Week 3", score: 71 },
  { date: "Week 4", score: 80 },
  { date: "Week 5", score: 82 },
  { date: "Week 6", score: 88 },
];

/**
 * LHIAreaChart — Premium Recharts AreaChart with dual gradient fill and active glow dots for LHI trends.
 */
export function LHIAreaChart({
  data = DEFAULT_LHI_DATA,
  color = "#5e6ad2",
  height = 200,
}: LHIAreaChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="lhiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.45} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-accent)] shadow-xl text-xs space-y-1">
                    <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="metric font-bold text-sm text-[var(--text-primary)]">
                        {payload[0].value} <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#lhiGradient)"
            activeDot={{ r: 6, fill: "#ffffff", stroke: color, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
