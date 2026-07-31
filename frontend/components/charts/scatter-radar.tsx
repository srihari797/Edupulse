"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface StudentScatterNode {
  id: number;
  name: string;
  academicScore: number; // 0 - 100 (X axis)
  socialInteraction: number; // 0 - 100 (Y axis)
  riskLevel: "High" | "Medium" | "Low";
  reason?: string;
}

interface ScatterRadarProps {
  students?: StudentScatterNode[];
  onNodeClick?: (node: StudentScatterNode) => void;
  height?: number;
}

const DEFAULT_SCATTER_STUDENTS: StudentScatterNode[] = [
  { id: 1, name: "Rahul B", academicScore: 88, socialInteraction: 78, riskLevel: "Low" },
  { id: 2, name: "Priya Sharma", academicScore: 92, socialInteraction: 85, riskLevel: "Low" },
  { id: 3, name: "Arjun Verma", academicScore: 48, socialInteraction: 32, riskLevel: "High", reason: "Significant drops in both quiz scores and extracurricular attendance" },
  { id: 4, name: "Sneha Patel", academicScore: 68, socialInteraction: 52, riskLevel: "Medium", reason: "Slight withdrawal in group discussions" },
  { id: 5, name: "Karan Gupta", academicScore: 95, socialInteraction: 90, riskLevel: "Low" },
  { id: 6, name: "Ananya Roy", academicScore: 55, socialInteraction: 42, riskLevel: "Medium", reason: "Missed 3 consecutive homework submissions" },
];

const riskColors: Record<string, string> = {
  High: "#ef4444", // Coral Red
  Medium: "#f59e0b", // Amber
  Low: "#10b981", // Emerald
};

/**
 * ScatterRadarChart — Admin AI Student Radar scatter plot using Recharts.
 * X Axis: Academic Performance Score
 * Y Axis: Social & Extracurricular Interaction Score
 * Nodes color-coded by risk level (Red=High Risk, Amber=Medium Risk, Green=Healthy).
 */
export function ScatterRadarChart({
  students = DEFAULT_SCATTER_STUDENTS,
  onNodeClick,
  height = 340,
}: ScatterRadarProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 24, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis
            type="number"
            dataKey="academicScore"
            name="Academic Score"
            unit="pts"
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            label={{
              value: "Academic Performance Score →",
              position: "bottom",
              fill: "var(--text-muted)",
              fontSize: 11,
              offset: 8,
            }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="socialInteraction"
            name="Social Interaction"
            unit="pts"
            domain={[0, 100]}
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            label={{
              value: "Social Interaction Score ↑",
              angle: -90,
              position: "insideLeft",
              fill: "var(--text-muted)",
              fontSize: 11,
            }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as StudentScatterNode;
                return (
                  <div className="p-3.5 rounded-lg bg-[var(--surface)] border border-[var(--border-accent)] shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
                      <span className="font-semibold text-[var(--text-primary)]">{data.name}</span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: riskColors[data.riskLevel],
                          backgroundColor: `${riskColors[data.riskLevel]}15`,
                        }}
                      >
                        {data.riskLevel} Risk
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] space-y-0.5">
                      <p>Academic Score: <span className="text-[var(--text-primary)] font-bold">{data.academicScore}</span></p>
                      <p>Social Score: <span className="text-[var(--text-primary)] font-bold">{data.socialInteraction}</span></p>
                    </div>
                    {data.reason && (
                      <p className="text-[10px] text-[var(--danger)] bg-[var(--danger)]/10 p-2 rounded border border-[var(--danger)]/20 leading-relaxed mt-1">
                        {data.reason}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter
            name="Students"
            data={students}
            onClick={(node) => onNodeClick?.(node as unknown as StudentScatterNode)}
            className="cursor-pointer"
          >
            {students.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={riskColors[entry.riskLevel] ?? "#5e6ad2"}
                stroke="#ffffff"
                strokeWidth={1.5}
                r={entry.riskLevel === "High" ? 8 : 6}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
