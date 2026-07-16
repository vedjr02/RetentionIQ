"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
import type { FeatureAdoptionPoint } from "@/lib/api";

const TOP_N = 3;

type FeatureRankingPanelProps = {
  series: FeatureAdoptionPoint[];
};

export function FeatureRankingPanel({ series }: FeatureRankingPanelProps) {
  const rankings = useMemo(() => {
    if (series.length === 0) return [];

    const latestWeek = series.reduce((max, point) =>
      point.week > max ? point.week : max,
    series[0].week);

    return series
      .filter((point) => point.week === latestWeek)
      .sort((a, b) => b.adoption_rate - a.adoption_rate)
      .slice(0, TOP_N);
  }, [series]);

  if (rankings.length === 0) return null;

  const latestWeek = rankings[0].week;

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Top features</h2>
        <p className="text-sm text-muted">
          Ranked by adoption in the latest week ({latestWeek})
        </p>
      </div>
      <div className="space-y-3">
        {rankings.map((row, index) => (
          <div
            key={row.feature}
            className="flex items-center gap-4 rounded-md bg-surface-muted px-4 py-3"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-soft text-xs font-semibold text-accent">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{row.feature}</p>
              <p className="text-xs text-muted">
                {row.adopting_users.toLocaleString()} of {row.active_users.toLocaleString()} active users
              </p>
            </div>
            <p className="tabular-nums text-lg font-semibold text-foreground">
              {row.adoption_rate.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
