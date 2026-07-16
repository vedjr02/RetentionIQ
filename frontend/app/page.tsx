"use client";

import { useState } from "react";
import { Layers, Repeat, Sparkles, TrendingUp } from "lucide-react";

import { MiniFunnelStrip } from "@/components/charts/MiniFunnelStrip";
import { OverviewQuickNav } from "@/components/dashboard/OverviewQuickNav";
import { ChannelComparison } from "@/components/dashboard/ChannelComparison";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DataState, KPIGridSkeleton } from "@/components/ui/DataState";
import { InsightPanel, InsightPanelFooter } from "@/components/ui/InsightPanel";
import { KPIStat } from "@/components/ui/KPIStat";
import { getChannelBreakdown, getFunnel, getOverview, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchOverview = (params: QueryParams, signal: AbortSignal) =>
  getOverview(params, signal);

const fetchChannelBreakdown = (params: QueryParams, signal: AbortSignal) =>
  getChannelBreakdown(params, signal);

const fetchFunnel = (params: QueryParams, signal: AbortSignal) =>
  getFunnel(params, signal);

export default function OverviewPage() {
  const [params, setParams] = useState<QueryParams>({});
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchOverview,
    params,
  });
  const channelQuery = useAnalyticsQuery({
    fetcher: fetchChannelBreakdown,
    params: { start_date: params.start_date, end_date: params.end_date },
  });
  const funnelQuery = useAnalyticsQuery({
    fetcher: fetchFunnel,
    params,
  });

  return (
    <DashboardShell
      title="Overview"
      description="Activation, retention, and adoption at a glance."
    >
      <DashboardFilters params={params} onChange={setParams} />

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

            {funnelQuery.data ? <MiniFunnelStrip stages={funnelQuery.data.stages} /> : null}

            {channelQuery.data ? (
              <ChannelComparison channels={channelQuery.data.channels} />
            ) : null}

            <InsightPanel
              meaning={response.insight.meaning}
              recommendation={response.insight.recommendation}
            />

            {channelQuery.data ? (
              <InsightPanel
                meaning={channelQuery.data.insight.meaning}
                recommendation={channelQuery.data.insight.recommendation}
                title="Channel insight"
              />
            ) : null}

            <InsightPanelFooter />
            <OverviewQuickNav />
          </div>
        )}
      </DataState>
    </DashboardShell>
  );
}
