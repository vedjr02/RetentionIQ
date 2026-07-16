"use client";

import { useState } from "react";

import { ChannelComparison } from "@/components/dashboard/ChannelComparison";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DataState, KPIGridSkeleton } from "@/components/ui/DataState";
import { InsightPanel } from "@/components/ui/InsightPanel";
import { KPIStat } from "@/components/ui/KPIStat";
import { getChannelBreakdown, getOverview, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchOverview = (params: QueryParams, signal: AbortSignal) =>
  getOverview(params, signal);

const fetchChannelBreakdown = (params: QueryParams, signal: AbortSignal) =>
  getChannelBreakdown(params, signal);

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
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KPIStat
                label="Activation rate"
                value={response.kpis.activation_rate}
                suffix="%"
                highlight
              />
              <KPIStat label="D7 retention" value={response.kpis.d7_retention} suffix="%" />
              <KPIStat label="D30 retention" value={response.kpis.d30_retention} suffix="%" />
              <KPIStat
                label={`Top feature · ${response.kpis.top_feature}`}
                value={response.kpis.top_feature_adoption}
                suffix="%"
              />
            </div>

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
          </div>
        )}
      </DataState>
    </DashboardShell>
  );
}
