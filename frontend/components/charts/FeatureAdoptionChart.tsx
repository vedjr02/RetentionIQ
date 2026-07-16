"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FeatureAdoptionPoint } from "@/lib/api";

const FEATURE_COLORS = [
  "var(--accent)",
  "var(--border-strong)",
  "#78716c",
];

type FeatureAdoptionChartProps = {
  series: FeatureAdoptionPoint[];
};

export function FeatureAdoptionChart({ series }: FeatureAdoptionChartProps) {
  const reduceMotion = useReducedMotion();

  const { chartData, features } = useMemo(() => {
    const featureList = Array.from(new Set(series.map((point) => point.feature)));
    const weeks = Array.from(new Set(series.map((point) => point.week))).sort();
    const lookup = new Map(
      series.map((point) => [`${point.week}-${point.feature}`, point.adoption_rate]),
    );

    const rows = weeks.map((week) => {
      const row: Record<string, string | number> = { week };
      featureList.forEach((feature) => {
        row[feature] = lookup.get(`${week}-${feature}`) ?? 0;
      });
      return row;
    });

    return { chartData: rows, features: featureList };
  }, [series]);

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Feature adoption over time"
        description="Weekly share of active users triggering each event"
        className="mb-6"
      />
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 56, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `${Number(value ?? 0).toFixed(1)}%`,
                "Adoption",
              ]}
            />
            {features.map((feature, index) => (
              <Line
                key={feature}
                type="monotone"
                dataKey={feature}
                stroke={FEATURE_COLORS[index % FEATURE_COLORS.length]}
                strokeWidth={index === 0 ? 2.5 : 1.75}
                dot={false}
                animationDuration={reduceMotion ? 0 : 400}
              >
                <LabelList
                  dataKey={feature}
                  position="right"
                  content={({ x, y, value, index: pointIndex }) => {
                    if (pointIndex !== chartData.length - 1 || x == null || y == null) {
                      return null;
                    }
                    return (
                      <text
                        x={Number(x) + 6}
                        y={Number(y) + 4}
                        fill={FEATURE_COLORS[index % FEATURE_COLORS.length]}
                        fontSize={11}
                        fontWeight={index === 0 ? 600 : 500}
                      >
                        {feature} {Number(value).toFixed(0)}%
                      </text>
                    );
                  }}
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
