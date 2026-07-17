"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { FeatureAdoptionPoint } from "@/lib/api";

const TOP_N = 3;

type FeatureRankingPanelProps = {
  series: FeatureAdoptionPoint[];
};

export function FeatureRankingPanel({ series }: FeatureRankingPanelProps) {
  const reduceMotion = useReducedMotion();

  const rankings = useMemo(() => {
    if (series.length === 0) return [];

    const latestWeek = series.reduce(
      (max, point) => (point.week > max ? point.week : max),
      series[0].week,
    );

    return series
      .filter((point) => point.week === latestWeek)
      .sort((a, b) => b.adoption_rate - a.adoption_rate)
      .slice(0, TOP_N);
  }, [series]);

  if (rankings.length === 0) {
    return (
      <Card variant="elevated">
        <EmptyState
          title="No feature rankings"
          description="Extend the date range to rank weekly feature adoption."
        />
      </Card>
    );
  }

  const latestWeek = rankings[0].week;
  const maxRate = rankings[0]?.adoption_rate ?? 1;

  return (
    <Card variant="elevated">
      <SectionHeader
        title="Top features"
        description={`Ranked by adoption in the latest week (${latestWeek})`}
        className="mb-6"
      />
      <div className="space-y-4">
        {rankings.map((row, index) => (
          <motion.div
            key={row.feature}
            initial={reduceMotion ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.08 }}
            className="rounded-xl border border-border bg-surface-muted/50 p-4"
          >
            <div className="mb-3 flex items-center gap-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{row.feature}</p>
                <p className="text-xs text-muted">
                  {row.adopting_users.toLocaleString()} of {row.active_users.toLocaleString()}{" "}
                  active users
                </p>
              </div>
              <p className="tabular-nums text-xl font-semibold text-foreground">
                {row.adoption_rate.toFixed(1)}%
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <motion.div
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${(row.adoption_rate / maxRate) * 100}%` }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 + index * 0.08 }}
                className="h-full rounded-full bg-accent"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
