"use client";

import { useState } from "react";

import { FunnelChart } from "@/components/charts/FunnelChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { InsightPanel } from "@/components/ui/InsightPanel";
import { getFunnel, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchFunnel = (params: QueryParams, signal: AbortSignal) =>
  getFunnel(params, signal);

export default function FunnelPage() {
  const [params, setParams] = useState<QueryParams>({});
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchFunnel,
    params,
  });

  return (
    <DashboardShell
      title="Funnel"
      description="Stage-by-stage conversion and drop-off."
    >
      <DashboardFilters params={params} onChange={setParams} />

      <DataState
        loading={loading}
        error={error}
        data={data}
        isEmpty={(response) => response.stages.length === 0}
        emptyTitle="No funnel data in this range"
        emptyDescription="Try widening the date range or clearing the channel filter."
        onRetry={retry}
        onResetFilters={() => setParams({})}
        skeleton={<ChartSkeleton />}
      >
        {(response) => (
          <div className="space-y-6">
            <FunnelChart stages={response.stages} />
            <InsightPanel
              meaning={response.insight.meaning}
              recommendation={response.insight.recommendation}
            />
          </div>
        )}
      </DataState>
    </DashboardShell>
  );
}
