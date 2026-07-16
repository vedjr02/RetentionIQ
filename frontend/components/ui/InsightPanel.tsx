import { Card } from "@/components/ui/Card";

type InsightPanelProps = {
  meaning: string;
  recommendation: string;
  title?: string;
};

export function InsightPanel({ meaning, recommendation, title }: InsightPanelProps) {
  return (
    <div className="space-y-3">
      {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : null}
      <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          What this means
        </p>
        <p className="text-sm leading-relaxed text-foreground">{meaning}</p>
      </Card>
      <Card className="border-accent/20 bg-accent-soft/40">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
          Recommended action
        </p>
        <p className="text-sm leading-relaxed text-foreground">{recommendation}</p>
      </Card>
      </div>
    </div>
  );
}
