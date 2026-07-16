"use client";

import { Database } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { useDashboardMeta } from "@/components/dashboard/DashboardMetaContext";
import { formatCompactNumber } from "@/lib/utils";

export function DataFreshnessBadge() {
  const { meta } = useDashboardMeta();

  if (!meta) return null;

  const range =
    meta.data_start && meta.data_end
      ? `${meta.data_start} – ${meta.data_end}`
      : "Loading range…";

  return (
    <>
      <div className="ml-auto hidden items-center gap-2 text-xs text-muted lg:flex">
        <Database className="h-3.5 w-3.5" aria-hidden />
        <span className="tabular-nums">
          {formatCompactNumber(meta.event_count)} events · {formatCompactNumber(meta.user_count)} users
        </span>
        <span className="text-border-strong">|</span>
        <span>{range}</span>
        <Badge className={meta.aggregates_ready ? undefined : "bg-surface-muted text-muted"}>
          {meta.aggregates_ready ? "Aggregates ready" : "Aggregates building"}
        </Badge>
      </div>
      <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted md:flex lg:hidden">
        <Database className="h-3 w-3" aria-hidden />
        <span className="tabular-nums">{formatCompactNumber(meta.event_count)} events</span>
        <Badge className="px-1.5 py-0.5 text-[10px]">
          {meta.aggregates_ready ? "Ready" : "Building"}
        </Badge>
      </div>
    </>
  );
}
