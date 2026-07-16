"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useDashboardFilters } from "@/components/dashboard/DashboardFilterContext";
import { Card } from "@/components/ui/Card";
import { buildFilterHref } from "@/lib/filterParams";

type DrillDownLinksProps = {
  links: Array<{ href: string; label: string; description: string }>;
};

export function DrillDownLinks({ links }: DrillDownLinksProps) {
  const { params } = useDashboardFilters();

  return (
    <Card variant="inset">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
        Related views
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={buildFilterHref(link.href, params)}
            className="group flex items-center justify-between rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm transition-colors hover:border-accent/30 hover:bg-accent-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div>
              <p className="font-medium text-foreground">{link.label}</p>
              <p className="text-xs text-muted">{link.description}</p>
            </div>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </Card>
  );
}
