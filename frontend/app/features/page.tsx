"use client";

import { FeatureAdoptionChart } from "@/components/charts/FeatureAdoptionChart";
import { FeatureRankingPanel } from "@/components/charts/FeatureRankingPanel";
import { useDashboardFilters } from "@/components/dashboard/DashboardFilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { ExportButton } from "@/components/ui/ExportButton";
import { InsightPanel, InsightPanelFooter } from "@/components/ui/InsightPanel";
import { getFeatures, type FeatureAdoptionPoint } from "@/lib/api";
import { downloadCsv } from "@/lib/exportCsv";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchFeatures = (params: Parameters<typeof getFeatures>[0], signal: AbortSignal) =>
  getFeatures(params, signal);

function exportFeatureSeries(series: FeatureAdoptionPoint[]) {
  downloadCsv(
    "retentioniq-features.csv",
    ["week", "feature", "adopting_users", "active_users", "adoption_rate"],
    series.map((row) => [
      row.week,
      row.feature,
      row.adopting_users,
      row.active_users,
      row.adoption_rate.toFixed(2),
    ]),
  );
}

function FeaturesContent() {
  const { params, setParams } = useDashboardFilters();
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchFeatures,
    params,
  });

  return (
    <>
      <DashboardFilters />
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
          <div className="space-y-8">
            <div className="flex justify-end">
              <ExportButton onExport={() => exportFeatureSeries(response.series)} />
            </div>
            <FeatureRankingPanel series={response.series} />
            <FeatureAdoptionChart series={response.series} />
            <InsightPanel
              meaning={response.insight.meaning}
              recommendation={response.insight.recommendation}
            />
            <InsightPanelFooter />
          </div>
        )}
      </DataState>
    </>
  );
}

export default function FeaturesPage() {
  return (
    <DashboardShell
      title="Features"
      description="Feature adoption over time."
    >
      <FeaturesContent />
    </DashboardShell>
  );
}
