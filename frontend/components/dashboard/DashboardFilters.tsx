"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { useDashboardMeta } from "@/components/dashboard/DashboardMetaContext";
import type { QueryParams } from "@/lib/api";

type DashboardFiltersProps = {
  params: QueryParams;
  onChange: (params: QueryParams) => void;
};

export function DashboardFilters({ params, onChange }: DashboardFiltersProps) {
  const { meta } = useDashboardMeta();

  return (
    <FilterBar
      params={params}
      channels={meta?.channels ?? []}
      onChange={onChange}
    />
  );
}
