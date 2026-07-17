"use client";

import { motion } from "framer-motion";

import type { FunnelStage } from "@/lib/api";

export const FUNNEL_STAGE_LABELS: Record<string, string> = {
  signup: "Signup",
  activation: "Activation",
  banner_click: "Banner click",
  paid_conversion: "Paid conversion",
  order: "Order",
};

type FunnelFlowProps = {
  stages: FunnelStage[];
  reduceMotion: boolean;
};

export function FunnelFlow({ stages, reduceMotion }: FunnelFlowProps) {
  const maxUsers = stages[0]?.users ?? 1;

  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">User flow</p>
      {stages.map((stage, index) => {
        const widthPct = Math.max((stage.users / maxUsers) * 100, 4);
        const next = stages[index + 1];
        const retainPct = next && stage.users > 0 ? (next.users / stage.users) * 100 : 100;
        const dropPct = next ? stage.dropoff_rate : 0;

        return (
          <div key={stage.stage} className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{FUNNEL_STAGE_LABELS[stage.stage] ?? stage.stage}</span>
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
