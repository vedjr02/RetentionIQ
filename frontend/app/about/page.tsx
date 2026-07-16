"use client";

import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/Card";

const SECTIONS = [
  {
    title: "What this dashboard answers",
    body: "RetentionIQ helps a product team see where users drop off in the funnel, which signup cohorts retain best, and which event types drive weekly adoption — using real Kaggle product-analytics data.",
  },
  {
    title: "Funnel definition",
    body: "Signup (first recorded event) → Activation (banner_click) → Paid conversion (order). Conversion and drop-off % are computed per stage in SQL from materialized per-user funnel timestamps.",
  },
  {
    title: "Retention definition",
    body: "Users are grouped by signup week. D1 / D7 / D30 retention = users active on that day after signup ÷ cohort size. The heatmap shows retention by weeks since signup.",
  },
  {
    title: "Feature adoption",
    body: "Adoption rate = users who triggered an event in a week ÷ active users that week. Top features are ranked by latest-week adoption.",
  },
  {
    title: "Performance approach",
    body: "Aggregates are pre-computed in Postgres materialized views and refreshed after data load. Filtered queries compose MV-backed sub-queries to stay under 500ms on 8.4M events.",
  },
  {
    title: "Stack",
    body: "FastAPI + SQLAlchemy + Alembic + Postgres backend. Next.js 14 + Tailwind + Recharts frontend. Full KPI formulas in docs/KPI_FORMULAS.md.",
  },
];

export default function AboutPage() {
  return (
    <DashboardShell
      title="Methodology"
      description="How RetentionIQ computes every metric — for portfolio review and interviews."
    >
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <Card key={section.title} variant="elevated">
            <h2 className="mb-2 text-base font-semibold text-foreground">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{section.body}</p>
          </Card>
        ))}
        <Card variant="inset">
          <p className="text-sm text-muted">
            Full formula reference:{" "}
            <Link href="https://github.com/vedjr02/RetentionIQ/blob/main/docs/KPI_FORMULAS.md" className="text-accent underline-offset-2 hover:underline">
              docs/KPI_FORMULAS.md
            </Link>
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
