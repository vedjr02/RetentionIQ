"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type KPIStatProps = {
  label: string;
  value: number | string | null;
  suffix?: string;
  loading?: boolean;
  highlight?: boolean;
  variant?: "default" | "hero";
  icon?: LucideIcon;
  hint?: string;
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
  variant = "default",
  icon: Icon,
  hint,
}: KPIStatProps) {
  const numericValue = typeof value === "number" ? value : null;
  const animated = useAnimatedNumber(numericValue, loading);
  const isHero = variant === "hero";

  return (
    <Card
      variant={isHero ? "accent" : "elevated"}
      className={cn(
        "flex flex-col",
        isHero ? "relative min-h-[9.5rem] gap-3 overflow-hidden" : "gap-2",
      )}
    >
      {isHero ? (
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-accent/10 blur-2xl"
          aria-hidden
        />
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "font-medium uppercase tracking-wide text-muted",
            isHero ? "text-xs" : "text-xs",
          )}
        >
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md",
              isHero
                ? "h-9 w-9 bg-accent/10 text-accent"
                : "h-8 w-8 bg-surface-muted text-muted",
            )}
          >
            <Icon className={isHero ? "h-4 w-4" : "h-3.5 w-3.5"} aria-hidden />
          </span>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className={isHero ? "h-12 w-32" : "h-8 w-24"} />
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "tabular-nums font-semibold tracking-tight",
            isHero ? "text-display text-accent" : "text-2xl",
            !isHero && highlight ? "text-accent" : !isHero ? "text-foreground" : "",
          )}
        >
          {typeof value === "string"
            ? value
            : `${animated?.toFixed(1) ?? "0.0"}${suffix}`}
        </motion.p>
      )}

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
