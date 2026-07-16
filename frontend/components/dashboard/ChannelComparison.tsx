"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Smartphone } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ChannelBreakdownRow } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChannelComparisonProps = {
  channels: ChannelBreakdownRow[];
};

const channelIcons = {
  mobile: Smartphone,
  desktop: Monitor,
} as const;

function MetricBar({ label, value, max, accent }: { label: string; value: number; max: number; accent?: boolean }) {
  const widthPct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className={cn("tabular-nums font-medium", accent ? "text-accent" : "text-foreground")}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={cn("h-full rounded-full", accent ? "bg-accent" : "bg-foreground/70")}
        />
      </div>
    </div>
  );
}

export function ChannelComparison({ channels }: ChannelComparisonProps) {
  const reduceMotion = useReducedMotion();

  if (channels.length === 0) return null;

  const maxActivation = Math.max(...channels.map((c) => c.activation_rate), 1);
  const maxConversion = Math.max(...channels.map((c) => c.conversion_rate), 1);

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Channel comparison"
        description="Mobile vs desktop activation and conversion."
        className="mb-6"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((row, index) => {
          const Icon = channelIcons[row.channel as keyof typeof channelIcons] ?? Monitor;

          return (
            <motion.div
              key={row.channel}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.08 }}
              className="rounded-xl border border-border bg-surface-muted/50 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-accent shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium capitalize text-foreground">{row.channel}</p>
                    <p className="text-xs text-muted">{row.users.toLocaleString()} users</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <MetricBar label="Activation" value={row.activation_rate} max={maxActivation} accent />
                <MetricBar label="Conversion" value={row.conversion_rate} max={maxConversion} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
