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

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FunnelStage } from "@/lib/api";

const STAGE_LABELS: Record<string, string> = {
  signup: "Signup",
  banner_click: "Banner click",
  order: "Order",
};

type FunnelChartProps = {
  stages: FunnelStage[];
};

function FunnelFlow({ stages, reduceMotion }: { stages: FunnelStage[]; reduceMotion: boolean }) {
  const maxUsers = stages[0]?.users ?? 1;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">User flow</p>
      {stages.map((stage, index) => {
        const widthPct = Math.max((stage.users / maxUsers) * 100, 4);
        const next = stages[index + 1];
        const retainPct = next ? (next.users / stage.users) * 100 : 100;
        const dropPct = next ? stage.dropoff_rate : 0;

        return (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{STAGE_LABELS[stage.stage] ?? stage.stage}</span>
              <span className="tabular-nums">{stage.users.toLocaleString()} users</span>
            </div>
            <div className="relative h-8 overflow-hidden rounded-md bg-surface-muted">
              <motion.div
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.1 }}
                className="absolute inset-y-0 left-0 rounded-md bg-border-strong"
              />
              {next ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.1 }}
                  className="absolute inset-y-0 right-0 flex items-center justify-end pr-2 text-[10px] font-medium text-danger"
                  style={{ width: `${100 - retainPct}%`, minWidth: dropPct > 0 ? "3rem" : 0 }}
                >
                  −{dropPct.toFixed(1)}%
                </motion.div>
              ) : null}
            </div>
            {next ? (
              <motion.div
                initial={reduceMotion ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.25, ease: "easeOut", delay: 0.2 + index * 0.1 }}
                className="mx-auto h-3 w-px origin-top bg-border-strong"
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const reduceMotion = useReducedMotion();
  const data = stages.map((stage) => ({
    ...stage,
    label: STAGE_LABELS[stage.stage] ?? stage.stage,
  }));

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Conversion funnel"
        description="Signup → banner click → order"
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
