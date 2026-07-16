"use client";

import { useCallback, useState } from "react";
import { Check, Link2 } from "lucide-react";

import { useDashboardFilters } from "@/components/dashboard/DashboardFilterContext";
import { useDashboardMeta } from "@/components/dashboard/DashboardMetaContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { QueryParams } from "@/lib/api";
import { DATASET_END_DATE, DATASET_START_DATE } from "@/lib/constants";
import { DATE_PRESETS } from "@/lib/datePresets";
import { buildFilterQuery } from "@/lib/filterParams";
import { cn } from "@/lib/utils";

function isPresetActive(
  params: QueryParams,
  preset: (typeof DATE_PRESETS)[number],
): boolean {
  return params.start_date === preset.start && params.end_date === preset.end;
}

export function FilterBar() {
  const { params, setParams } = useDashboardFilters();
  const { meta } = useDashboardMeta();
  const channels = meta?.channels ?? [];
  const [copied, setCopied] = useState(false);

  const copyShareLink = useCallback(async () => {
    const query = buildFilterQuery(params);
    const url = `${window.location.origin}${window.location.pathname}${query}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [params]);

  return (
    <Card variant="elevated" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                setParams({
                  ...params,
                  start_date: preset.start,
                  end_date: preset.end,
                })
              }
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isPresetActive(params, preset)
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={copyShareLink} className="gap-2 text-xs">
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              Copy link
            </>
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Start date</span>
          <input
            type="date"
            min={DATASET_START_DATE}
            max={DATASET_END_DATE}
            value={params.start_date ?? ""}
            onChange={(event) =>
              setParams({ ...params, start_date: event.target.value || undefined })
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">End date</span>
          <input
            type="date"
            min={DATASET_START_DATE}
            max={DATASET_END_DATE}
            value={params.end_date ?? ""}
            onChange={(event) =>
              setParams({ ...params, end_date: event.target.value || undefined })
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Channel</span>
          <select
            value={params.channel ?? ""}
            onChange={(event) =>
              setParams({ ...params, channel: event.target.value || undefined })
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="">All channels</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </label>
        <Button variant="ghost" onClick={() => setParams({})} className="md:mb-0.5">
          Clear
        </Button>
      </div>
    </Card>
  );
}
