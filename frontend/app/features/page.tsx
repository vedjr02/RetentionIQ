"use client";

import { useState } from "react";

import { FeatureAdoptionChart } from "@/components/charts/FeatureAdoptionChart";
import { FeatureRankingPanel } from "@/components/charts/FeatureRankingPanel";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { InsightPanel } from "@/components/ui/InsightPanel";
import { getFeatures, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchFeatures = (params: QueryParams, signal: AbortSignal) =>
  getFeatures(params, signal);

export default function FeaturesPage() {
  const [params, setParams] = useState<QueryParams>({});
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchFeatures,
    params,
  });

  return (
    <DashboardShell
      title="Features"
      description="Feature adoption over time."
    >
      <DashboardFilters params={params} onChange={setParams} />

      <DataState
        loading={loading}
        error={error}
        data={data}
        isEmpty={(response) => response.series.length === 0}
        emptyTitle="No feature adoption data"
        emptyDescription="Extend the date range or clear filters to see weekly adoption trends."
        onRetry={retry}
        onResetFilters={() => setParams({})}
        skeleton={<ChartSkeleton />}
      >
        {(response) => (
          <div className="space-y-6">
            <FeatureRankingPanel series={response.series} />
            <FeatureAdoptionChart series={response.series} />
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
