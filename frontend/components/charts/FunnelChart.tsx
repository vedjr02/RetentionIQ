"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FUNNEL_STAGE_LABELS, FunnelFlow } from "@/components/charts/FunnelFlow";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FunnelStage } from "@/lib/api";

type FunnelChartProps = {
  stages: FunnelStage[];
};

export function FunnelChart({ stages }: FunnelChartProps) {
  const reduceMotion = useReducedMotion();
  const data = stages.map((stage) => ({
    ...stage,
    label: FUNNEL_STAGE_LABELS[stage.stage] ?? stage.stage,
  }));

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Conversion funnel"
        description="Signup → activation → paid conversion"
        className="mb-6"
      />

      <FunnelFlow stages={stages} reduceMotion={!!reduceMotion} />

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              axisLine={false}
              tickLine={false}
              width={120}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--surface-muted)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                fontSize: "12px",
              }}
              formatter={(value, name) => {
                if (name === "users") return [Number(value ?? 0).toLocaleString(), "Users"];
                return [value ?? 0, name];
              }}
            />
            <Bar
              dataKey="users"
              radius={[0, 8, 8, 0]}
              animationDuration={reduceMotion ? 0 : 400}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.stage}
                  fill={index === data.length - 1 ? "var(--accent)" : "var(--border-strong)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {data.slice(1).map((stage, index) => (
          <motion.div
            key={stage.stage}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.3 + index * 0.08 }}
            className="rounded-lg border border-border bg-surface-muted/80 px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wide text-muted">{stage.label} drop-off</p>
            <p className="tabular-nums text-lg font-semibold text-danger">
              {stage.dropoff_rate.toFixed(1)}%
            </p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
