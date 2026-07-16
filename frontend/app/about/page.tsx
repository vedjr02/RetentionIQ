"use client";

import Link from "next/link";
import { ExternalLink, Code2 } from "lucide-react";

import { ProjectStats } from "@/components/dashboard/ProjectStats";
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
];

const ARCHITECTURE = `CSV (product.csv)
  ↓ load_kaggle_data.py
Postgres (users + events + materialized views)
  ↓ FastAPI routers (SQL-first)
Next.js dashboard (Overview / Funnel / Cohorts / Features)`;

export default function AboutPage() {
  return (
    <DashboardShell
      title="Methodology"
      description="How RetentionIQ computes every metric — for portfolio review and interviews."
    >
      <div className="space-y-6">
        <ProjectStats />

        {SECTIONS.map((section) => (
          <Card key={section.title} variant="elevated">
            <h2 className="mb-2 text-base font-semibold text-foreground">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{section.body}</p>
          </Card>
        ))}

        <Card variant="elevated">
          <h2 className="mb-3 text-base font-semibold text-foreground">Architecture</h2>
          <pre className="overflow-x-auto rounded-lg border border-border bg-surface-muted/60 p-4 text-xs leading-relaxed text-muted">
            {ARCHITECTURE}
          </pre>
        </Card>

        <Card variant="inset">
          <h2 className="mb-2 text-base font-semibold text-foreground">Stack & links</h2>
          <p className="mb-4 text-sm text-muted">
            FastAPI + SQLAlchemy + Alembic + Postgres backend. Next.js 14 + Tailwind + Recharts
            frontend. Full KPI formulas in docs/KPI_FORMULAS.md.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="https://github.com/vedjr02/RetentionIQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:border-border-strong"
            >
              <Code2 className="h-4 w-4" aria-hidden />
              Source on GitHub
              <ExternalLink className="h-3 w-3 text-muted" aria-hidden />
            </Link>
            <Link
              href="https://github.com/vedjr02/RetentionIQ/blob/main/docs/KPI_FORMULAS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-accent transition-colors hover:border-accent/40"
            >
              KPI formulas
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
