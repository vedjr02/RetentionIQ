"use client";

import { FunnelChart } from "@/components/charts/FunnelChart";
import { useDashboardFilters } from "@/components/dashboard/DashboardFilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DrillDownLinks } from "@/components/dashboard/DrillDownLinks";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { InsightPanel, InsightPanelFooter } from "@/components/ui/InsightPanel";
import { getFunnel } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchFunnel = (params: Parameters<typeof getFunnel>[0], signal: AbortSignal) =>
  getFunnel(params, signal);

function FunnelContent() {
  const { params, setParams } = useDashboardFilters();
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchFunnel,
    params,
  });

  return (
    <>
      <DashboardFilters />
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
          <div className="space-y-8">
            <FunnelChart stages={response.stages} />
            <DrillDownLinks
              links={[
                {
                  href: "/cohorts",
                  label: "Cohort retention",
                  description: "See if drop-off cohorts retain worse over time",
                },
                {
                  href: "/features",
                  label: "Feature adoption",
                  description: "Check if activation events drive later orders",
                },
              ]}
            />
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

export default function FunnelPage() {
  return (
    <DashboardShell
      title="Funnel"
      description="Stage-by-stage conversion and drop-off."
    >
      <FunnelContent />
    </DashboardShell>
  );
}
