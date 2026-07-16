"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type KPIStatProps = {
  label: string;
  value: number | string | null;
  suffix?: string;
  loading?: boolean;
  highlight?: boolean;
};

function useAnimatedNumber(value: number | null, loading: boolean) {
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (loading || value === null) return;

    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const start = display;
    const delta = value - start;
    const duration = 350;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + delta * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, loading, reduceMotion, display]);

  return loading || value === null ? null : display;
}

export function KPIStat({
  label,
  value,
  suffix = "",
  loading = false,
  highlight = false,
}: KPIStatProps) {
  const numericValue = typeof value === "number" ? value : null;
  const animated = useAnimatedNumber(numericValue, loading);

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={[
            "tabular-nums text-2xl font-semibold",
            highlight ? "text-accent" : "text-foreground",
          ].join(" ")}
        >
          {typeof value === "string"
            ? value
            : `${animated?.toFixed(1) ?? "0.0"}${suffix}`}
        </motion.p>
      )}
    </Card>
  );
}
