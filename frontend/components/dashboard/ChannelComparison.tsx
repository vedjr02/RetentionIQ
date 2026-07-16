"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import type { ChannelBreakdownRow } from "@/lib/api";

type ChannelComparisonProps = {
  channels: ChannelBreakdownRow[];
};

export function ChannelComparison({ channels }: ChannelComparisonProps) {
  const reduceMotion = useReducedMotion();

  if (channels.length === 0) return null;

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Channel comparison</h2>
        <p className="text-sm text-muted">Mobile vs desktop activation and conversion</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((row, index) => (
          <motion.div
            key={row.channel}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.08 }}
            className="rounded-md border border-border bg-surface-muted p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium capitalize text-foreground">{row.channel}</p>
              <p className="text-xs text-muted">{row.users.toLocaleString()} users</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Activation</p>
                <p className="tabular-nums text-xl font-semibold text-accent">
                  {row.activation_rate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Conversion</p>
                <p className="tabular-nums text-xl font-semibold text-foreground">
                  {row.conversion_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
