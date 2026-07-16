"use client";

import { useState } from "react";

import { RetentionCurveChart } from "@/components/charts/RetentionCurveChart";
import { RetentionHeatmap } from "@/components/charts/RetentionHeatmap";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";
import { ChartSkeleton, DataState } from "@/components/ui/DataState";
import { InsightPanel, InsightPanelFooter } from "@/components/ui/InsightPanel";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getCohorts, type QueryParams } from "@/lib/api";
import { useAnalyticsQuery } from "@/lib/useAnalyticsQuery";
import { cn } from "@/lib/utils";

const fetchCohorts = (params: QueryParams, signal: AbortSignal) =>
  getCohorts(params, signal);

function retentionTone(rate: number) {
  if (rate >= 25) return "bg-success/15 text-success";
  if (rate >= 10) return "bg-accent/15 text-accent";
  return "bg-surface-muted text-muted";
}

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
          <div className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-2">
              <RetentionCurveChart summary={response.summary} />
              <RetentionHeatmap cells={response.heatmap} />
            </div>

            <Card variant="elevated">
              <SectionHeader title="Cohort summary" className="mb-6" />
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                      <th className="pb-3 pr-4 font-medium">Cohort week</th>
                      <th className="pb-3 pr-4 font-medium">Size</th>
                      <th className="pb-3 pr-4 font-medium">D1</th>
                      <th className="pb-3 pr-4 font-medium">D7</th>
                      <th className="pb-3 font-medium">D30</th>
                    </tr>
                  </thead>
                  <tbody>
                    {response.summary.map((row) => (
                      <tr
                        key={row.cohort_week}
                        className="border-t border-border/80 transition-colors hover:bg-surface-muted/40"
                      >
                        <td className="py-3.5 pr-4 font-medium">{row.cohort_week}</td>
                        <td className="tabular-nums py-3.5 pr-4 text-muted">
                          {row.cohort_size.toLocaleString()}
                        </td>
                        {(
                          [
                            ["d1_retention", row.d1_retention],
                            ["d7_retention", row.d7_retention],
                            ["d30_retention", row.d30_retention],
                          ] as const
                        ).map(([key, rate]) => (
                          <td key={key} className="py-3.5 pr-4">
                            <span
                              className={cn(
                                "inline-flex min-w-[3.5rem] justify-center rounded-md px-2 py-0.5 tabular-nums text-xs font-medium",
                                retentionTone(rate),
                              )}
                            >
                              {rate.toFixed(1)}%
                            </span>
                          </td>
                        ))}
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
            <InsightPanelFooter />
          </div>
        )}
      </DataState>
    </DashboardShell>
  );
}
