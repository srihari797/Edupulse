"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark?: number;
}

interface GrowthRadarProps {
  data?: RadarDataPoint[];
  size?: number;
  color?: string;
  className?: string;
}

const DEFAULT_RADAR_DATA: RadarDataPoint[] = [
  { subject: "Cognitive", score: 88, fullMark: 100 },
  { subject: "Social-Emotional", score: 82, fullMark: 100 },
  { subject: "Physical", score: 91, fullMark: 100 },
  { subject: "Extra-curricular", score: 76, fullMark: 100 },
  { subject: "Ethics & Citizenship", score: 89, fullMark: 100 },
];

/**
 * GrowthRadar — Premium 5-Axis Holistic Growth Passport Radar Chart.
 * Linear/Vercel styled: translucent gradient fill, subtle gridlines, glowing dots, high-contrast tooltips.
 */
export function GrowthRadar({
  data = DEFAULT_RADAR_DATA,
  color = "#5e6ad2",
  className,
}: GrowthRadarProps) {
  return (
    <div className={className} style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
          <PolarAngleAxis
            dataKey="subject"
            tick={({ x, y, payload }) => (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                fill="var(--text-secondary)"
                className="text-[11px] font-medium tracking-tight"
              >
                {payload.value}
              </text>
            )}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Holistic Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.35}
            strokeWidth={2.5}
            dot={{ r: 4, fill: color, stroke: "#ffffff", strokeWidth: 1.5 }}
            activeDot={{ r: 6, fill: "#ffffff", stroke: color, strokeWidth: 2 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as RadarDataPoint;
                return (
                  <div className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border-accent)] shadow-xl text-xs space-y-1">
                    <p className="font-semibold text-[var(--text-primary)]">{item.subject}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="metric font-bold text-sm text-[var(--text-primary)]">
                        {item.score} <span className="text-[10px] text-[var(--text-muted)]">/ 100</span>
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
