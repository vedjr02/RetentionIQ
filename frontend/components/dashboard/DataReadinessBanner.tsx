"use client";

import { Database, RefreshCw } from "lucide-react";

import { useDashboardMeta } from "@/components/dashboard/DashboardMetaContext";
import { formatCompactNumber } from "@/lib/utils";

export function DataReadinessBanner() {
  const { meta, loading, refresh } = useDashboardMeta();

  if (loading || !meta) return null;

  const hasData = meta.event_count > 0;

  if (hasData) return null;

  return (
    <div className="rounded-xl border border-accent/25 bg-accent-soft/60 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Database className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Dataset not loaded yet</p>
            <p className="mt-1 text-sm text-muted">
              The API is connected but Postgres has no events. A full Kaggle load takes a few
              minutes — this banner clears automatically once data arrives.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Check again
        </button>
      </div>
      {meta.aggregates_ready ? (
        <p className="mt-2 pl-11 text-xs text-muted">
          Aggregates ready · waiting for{" "}
          <span className="tabular-nums font-medium text-foreground">
            {formatCompactNumber(meta.event_count)}
          </span>{" "}
          events
        </p>
      ) : null}
    </div>
  );
}
