"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { CohortRow } from "@/lib/api";

type RetentionCurveChartProps = {
  summary: CohortRow[];
};

type CurvePoint = {
  milestone: string;
  rate: number;
};

function averageRetention(summary: CohortRow[], key: keyof Pick<CohortRow, "d1_retention" | "d7_retention" | "d30_retention">) {
  if (summary.length === 0) return 0;
  const total = summary.reduce((sum, row) => sum + row[key], 0);
  return total / summary.length;
}

export function RetentionCurveChart({ summary }: RetentionCurveChartProps) {
  const data: CurvePoint[] = [
    { milestone: "D1", rate: averageRetention(summary, "d1_retention") },
    { milestone: "D7", rate: averageRetention(summary, "d7_retention") },
    { milestone: "D30", rate: averageRetention(summary, "d30_retention") },
  ];

  if (summary.length === 0) return null;

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Retention curve"
        description="Weighted average across visible cohorts — D1, D7, and D30."
        className="mb-6"
      />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="milestone"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, "Retention"]}
              contentStyle={{
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "var(--accent)", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "var(--accent)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
