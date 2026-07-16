"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import type { HeatmapCell } from "@/lib/api";
import { cn } from "@/lib/utils";

type RetentionHeatmapProps = {
  cells: HeatmapCell[];
};

function rateToColor(rate: number): string {
  const alpha = Math.min(Math.max(rate / 100, 0.08), 1);
  return `color-mix(in srgb, var(--accent) ${Math.round(alpha * 100)}%, transparent)`;
}

export function RetentionHeatmap({ cells }: RetentionHeatmapProps) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);

  const { cohorts, weeks, matrix } = useMemo(() => {
    const cohortSet = Array.from(new Set(cells.map((cell) => cell.cohort_week))).sort();
    const weekSet = Array.from(new Set(cells.map((cell) => cell.week_since_signup))).sort(
      (a, b) => a - b,
    );
    const lookup = new Map(
      cells.map((cell) => [`${cell.cohort_week}-${cell.week_since_signup}`, cell]),
    );

    return {
      cohorts: cohortSet,
      weeks: weekSet,
      matrix: lookup,
    };
  }, [cells]);

  return (
    <Card>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Retention heatmap</h2>
          <p className="text-sm text-muted">Cohort × weeks since signup — hover to scrub row and column</p>
        </div>
        {hovered ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-md border border-border bg-surface-muted px-4 py-2 text-right"
          >
            <p className="text-xs text-muted">
              {hovered.cohort_week} · week {hovered.week_since_signup}
            </p>
            <p className="tabular-nums text-lg font-semibold text-accent">
              {hovered.retention_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted">
              {hovered.retained_users.toLocaleString()} / {hovered.cohort_size.toLocaleString()} users
            </p>
          </motion.div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `120px repeat(${weeks.length}, minmax(56px, 1fr))`,
          }}
        >
          <div />
          {weeks.map((week) => (
            <div
              key={week}
              className={cn(
                "rounded-sm px-2 py-1 text-center text-xs transition-colors duration-150",
                hovered?.week_since_signup === week
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted",
              )}
            >
              W{week}
            </div>
          ))}
          {cohorts.map((cohort) => (
            <div key={cohort} className="contents">
              <div
                className={cn(
                  "flex items-center rounded-sm pr-3 text-xs transition-colors duration-150",
                  hovered?.cohort_week === cohort
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-muted",
                )}
              >
                {cohort}
              </div>
              {weeks.map((week) => {
                const cell = matrix.get(`${cohort}-${week}`);
                if (!cell) {
                  return <div key={`${cohort}-${week}`} className="h-10 rounded-sm bg-surface-muted" />;
                }

                const isActive =
                  hovered?.cohort_week === cell.cohort_week ||
                  hovered?.week_since_signup === cell.week_since_signup;
                const isFocused =
                  hovered?.cohort_week === cell.cohort_week &&
                  hovered?.week_since_signup === cell.week_since_signup;

                return (
                  <motion.button
                    key={`${cohort}-${week}`}
                    type="button"
                    onMouseEnter={() => setHovered(cell)}
                    onFocus={() => setHovered(cell)}
                    onMouseLeave={() => setHovered(null)}
                    onBlur={() => setHovered(null)}
                    whileHover={reduceMotion ? undefined : { scale: isFocused ? 1.06 : 1.02 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={cn(
                      "h-10 rounded-sm border border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      isFocused && "border-accent ring-1 ring-accent/30",
                      isActive && !isFocused && "opacity-100",
                      hovered && !isActive && "opacity-35",
                    )}
                    style={{ backgroundColor: rateToColor(cell.retention_rate) }}
                    aria-label={`${cohort} week ${week}: ${cell.retention_rate}% retention`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
