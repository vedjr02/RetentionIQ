"use client";

import { useDashboardMeta } from "@/components/dashboard/DashboardMetaContext";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompactNumber } from "@/lib/utils";

export function ProjectStats() {
  const { meta, loading } = useDashboardMeta();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} variant="inset">
            <Skeleton className="mb-2 h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!meta) return null;

  const stats = [
    { label: "Events loaded", value: formatCompactNumber(meta.event_count) },
    { label: "Users tracked", value: formatCompactNumber(meta.user_count) },
    {
      label: "Aggregates",
      value: meta.aggregates_ready ? "Ready" : "Building",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} variant="accent">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
