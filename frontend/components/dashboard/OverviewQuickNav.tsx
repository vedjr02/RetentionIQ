"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Filter, Layers, Users } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

const LINKS = [
  {
    href: "/funnel",
    label: "Funnel",
    description: "Stage-by-stage drop-off and conversion",
    icon: Filter,
  },
  {
    href: "/cohorts",
    label: "Cohorts",
    description: "Retention heatmap and D1/D7/D30 curves",
    icon: Users,
  },
  {
    href: "/features",
    label: "Features",
    description: "Weekly adoption trends by event type",
    icon: Layers,
  },
] as const;

export function OverviewQuickNav() {
  const reduceMotion = useReducedMotion();

  return (
    <Card variant="inset">
      <SectionHeader
        title="Explore deeper"
        description="Jump to the view that answers your next question."
        className="mb-4"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {LINKS.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut", delay: index * 0.06 }}
            >
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface-elevated p-4 shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
