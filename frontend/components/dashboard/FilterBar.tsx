"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DATASET_END_DATE, DATASET_START_DATE } from "@/lib/constants";
import { DATE_PRESETS } from "@/lib/datePresets";
import type { QueryParams } from "@/lib/api";
import { cn } from "@/lib/utils";

type FilterBarProps = {
  params: QueryParams;
  channels: string[];
  onChange: (params: QueryParams) => void;
};

function isPresetActive(
  params: QueryParams,
  preset: (typeof DATE_PRESETS)[number],
): boolean {
  return params.start_date === preset.start && params.end_date === preset.end;
}

export function FilterBar({ params, channels, onChange }: FilterBarProps) {
  return (
    <Card variant="elevated" className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() =>
              onChange({
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
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Start date</span>
          <input
            type="date"
            min={DATASET_START_DATE}
            max={DATASET_END_DATE}
            value={params.start_date ?? ""}
            onChange={(event) =>
              onChange({ ...params, start_date: event.target.value || undefined })
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
              onChange({ ...params, end_date: event.target.value || undefined })
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Channel</span>
          <select
            value={params.channel ?? ""}
            onChange={(event) =>
              onChange({ ...params, channel: event.target.value || undefined })
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
        <Button variant="ghost" onClick={() => onChange({})} className="md:mb-0.5">
          Clear
        </Button>
      </div>
    </Card>
  );
}
