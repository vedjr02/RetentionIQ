"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Lightbulb } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";

type InsightPanelProps = {
  meaning: string;
  recommendation: string;
  title?: string;
};

export function InsightPanel({ meaning, recommendation, title }: InsightPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4" role="region" aria-label={title ?? "Insights"}>
      {title ? <SectionHeader title={title} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Card variant="elevated" className="relative overflow-hidden border-l-4 border-l-border-strong pl-5">
            <div className="mb-3 flex items-center gap-2 text-muted">
              <Lightbulb className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide">What this means</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{meaning}</p>
          </Card>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.06 }}
        >
          <Card variant="accent" className="relative overflow-hidden">
            <div className="mb-3 flex items-center gap-2 text-accent">
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide">Recommended action</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{recommendation}</p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export function InsightPanelFooter() {
  return (
    <p className="text-xs text-muted">
      Insights are generated from aggregate metrics — see{" "}
      <Link href="/about" className="font-medium text-accent underline-offset-2 hover:underline">
        methodology
      </Link>{" "}
      for definitions.
    </p>
  );
}
