import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "inset" | "accent";
};

const variants = {
  default: "rounded-lg border border-border bg-surface p-6 shadow-sm",
  elevated:
    "rounded-xl border border-border/80 bg-surface-elevated p-6 shadow-md",
  inset: "rounded-lg border border-border bg-surface-muted/60 p-6",
  accent:
    "rounded-xl border border-accent/20 bg-gradient-to-br from-surface-elevated to-accent-soft/30 p-6 shadow-md",
};

export function Card({ children, className, variant = "default" }: CardProps) {
  return <div className={cn(variants[variant], className)}>{children}</div>;
}
