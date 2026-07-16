"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FunnelStage } from "@/lib/api";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  signup: "Signup",
  banner_click: "Banner click",
  order: "Order",
};

type MiniFunnelStripProps = {
  stages: FunnelStage[];
};

export function MiniFunnelStrip({ stages }: MiniFunnelStripProps) {
  const reduceMotion = useReducedMotion();
  const maxUsers = stages[0]?.users ?? 1;

  return (
    <Card variant="elevated">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <SectionHeader
          title="Conversion funnel"
          description="Signup → banner click → order for the selected range."
        />
        <Link
          href="/funnel"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-foreground"
        >
          Full funnel
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-2">
        {stages.map((stage, index) => {
          const widthPct = Math.max((stage.users / maxUsers) * 100, 8);
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.stage} className="flex min-w-0 flex-1 items-center gap-2 md:flex-col md:gap-3">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scaleX: 0.85 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: index * 0.08 }}
                className="w-full"
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {STAGE_LABELS[stage.stage] ?? stage.stage}
                  </span>
                  <span className="tabular-nums text-muted">
                    {stage.users.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
                  <motion.div
                    initial={reduceMotion ? false : { width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
                    className={cn(
                      "h-full rounded-full",
                      index === 0
                        ? "bg-foreground/80"
                        : index === 1
                          ? "bg-accent/70"
                          : "bg-accent",
                    )}
                  />
                </div>
                {!isLast ? (
                  <p className="mt-1.5 tabular-nums text-xs text-muted">
                    {stage.conversion_rate.toFixed(1)}% to next
                  </p>
                ) : (
                  <p className="mt-1.5 tabular-nums text-xs text-accent">
                    {stage.conversion_rate.toFixed(1)}% overall
                  </p>
                )}
              </motion.div>

              {!isLast ? (
                <ArrowRight
                  className="hidden h-4 w-4 shrink-0 text-border-strong md:block"
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
