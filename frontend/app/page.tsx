"use client";

import { Layers, Repeat, Sparkles, TrendingUp } from "lucide-react";

import { MiniFunnelStrip } from "@/components/charts/MiniFunnelStrip";
import { ChannelComparison } from "@/components/dashboard/ChannelComparison";
import { useDashboardFilters } from "@/components/dashboard/DashboardFilterContext";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OverviewQuickNav } from "@/components/dashboard/OverviewQuickNav";
import { DataState, KPIGridSkeleton } from "@/components/ui/DataState";
import { InsightPanel, InsightPanelFooter } from "@/components/ui/InsightPanel";
import { KPIStat } from "@/components/ui/KPIStat";
import { getOverview } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchOverview = (params: Parameters<typeof getOverview>[0], signal: AbortSignal) =>
  getOverview(params, signal);

function OverviewContent() {
  const { params, setParams } = useDashboardFilters();
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchOverview,
    params,
  });

  return (
    <>
      <DashboardFilters />
      <DataState
        loading={loading}
        error={error}
        data={data}
        emptyTitle="No overview metrics yet"
        emptyDescription="Load event data into Postgres, then refresh this page."
        onRetry={retry}
        onResetFilters={() => setParams({})}
        skeleton={<KPIGridSkeleton />}
      >
        {(response) => (
          <div className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <KPIStat
                  variant="hero"
                  label="Activation rate"
                  value={response.kpis.activation_rate}
                  suffix="%"
                  highlight
                  icon={Sparkles}
                  hint="Users who clicked a banner after signup"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
                <KPIStat
                  label="D7 retention"
                  value={response.kpis.d7_retention}
                  suffix="%"
                  icon={Repeat}
                />
                <KPIStat
                  label="D30 retention"
                  value={response.kpis.d30_retention}
                  suffix="%"
                  icon={TrendingUp}
                />
                <KPIStat
                  label="Top feature adoption"
                  value={response.kpis.top_feature_adoption}
                  suffix="%"
                  icon={Layers}
                  hint={response.kpis.top_feature}
                />
              </div>
            </div>

            <MiniFunnelStrip stages={response.funnel_stages} />

            {response.channels.length > 0 ? (
              <ChannelComparison channels={response.channels} />
            ) : null}

            <InsightPanel
              meaning={response.insight.meaning}
              recommendation={response.insight.recommendation}
            />

            {response.channels.length > 0 ? (
              <InsightPanel
                meaning={response.channel_insight.meaning}
                recommendation={response.channel_insight.recommendation}
                title="Channel insight"
              />
            ) : null}

            <InsightPanelFooter />
            <OverviewQuickNav />
          </div>
        )}
      </DataState>
    </>
  );
}

export default function OverviewPage() {
  return (
    <DashboardShell
      title="Overview"
      description="Activation, retention, and adoption at a glance."
    >
      <OverviewContent />
    </DashboardShell>
  );
}
