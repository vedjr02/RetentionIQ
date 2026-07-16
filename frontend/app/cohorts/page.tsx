"use client";

import { useState } from "react";

import { RetentionHeatmap } from "@/components/charts/RetentionHeatmap";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { InsightPanel } from "@/components/ui/InsightPanel";
import { getCohorts, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";

const fetchCohorts = (params: QueryParams, signal: AbortSignal) =>
  getCohorts(params, signal);

export default function CohortsPage() {
  const [params, setParams] = useState<QueryParams>({});
  const { data, loading, error, retry } = useAnalyticsQuery({
    fetcher: fetchCohorts,
    params,
  });

  return (
    <DashboardShell
      title="Cohorts"
      description="Retention curves by signup cohort."
    >
      <DashboardFilters params={params} onChange={setParams} />

      <DataState
        loading={loading}
        error={error}
        data={data}
        isEmpty={(response) => response.heatmap.length === 0}
        emptyTitle="No cohorts in this range"
        emptyDescription="Widen the signup date filter to include more cohort weeks."
        onRetry={retry}
        onResetFilters={() => setParams({})}
        skeleton={<ChartSkeleton />}
      >
        {(response) => (
          <div className="space-y-6">
            <RetentionHeatmap cells={response.heatmap} />
            <Card>
              <h2 className="mb-4 text-lg font-semibold">Cohort summary</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="pb-3 pr-4">Cohort week</th>
                      <th className="pb-3 pr-4">Size</th>
                      <th className="pb-3 pr-4">D1</th>
                      <th className="pb-3 pr-4">D7</th>
                      <th className="pb-3">D30</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.summary.map((row) => (
                      <tr key={row.cohort_week} className="border-t border-border">
                        <td className="py-3 pr-4">{row.cohort_week}</td>
                        <td className="tabular-nums py-3 pr-4">{row.cohort_size.toLocaleString()}</td>
                        <td className="tabular-nums py-3 pr-4">{row.d1_retention.toFixed(1)}%</td>
                        <td className="tabular-nums py-3 pr-4">{row.d7_retention.toFixed(1)}%</td>
                        <td className="tabular-nums py-3">{row.d30_retention.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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
