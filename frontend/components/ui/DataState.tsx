"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

type DataStateProps<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
  isEmpty?: (data: T) => boolean;
  emptyTitle: string;
  emptyDescription: string;
  onRetry: () => void;
  onResetFilters?: () => void;
  skeleton: React.ReactNode;
  children: (data: T) => React.ReactNode;
};

export function DataState<T>({
  loading,
  error,
  data,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  onResetFilters,
  skeleton,
  children,
}: DataStateProps<T>) {
  const statusMessage = loading
    ? "Loading analytics…"
    : error
      ? "Error loading analytics"
      : !data || (isEmpty && isEmpty(data))
        ? "No data for current filters"
        : "Analytics loaded";

  if (loading) {
    return (
      <>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
        {skeleton}
      </>
    );
  }

  if (error) {
    const hint = error.includes("Cannot reach the API")
      ? error
      : `${error}. Check that the API is running, then try again.`;

    return (
      <div className="rounded-lg border border-danger/20 bg-surface p-6" role="alert">
        <p className="sr-only" aria-live="assertive" aria-atomic="true">
          {statusMessage}
        </p>
        <h3 className="text-base font-medium text-foreground">We couldn&apos;t load this view</h3>
        <p className="mt-2 text-sm text-muted">{hint}</p>
        <div className="mt-4 flex gap-3">
          <Button variant="primary" onClick={onRetry}>
            Retry
          </Button>
          {onResetFilters ? (
            <Button variant="ghost" onClick={onResetFilters}>
              Reset filters
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return (
      <>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={onResetFilters ? "Reset filters" : undefined}
          onAction={onResetFilters}
        />
      </>
    );
  }

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
      {children(data)}
    </>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function KPIGridSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-5">
        <Skeleton className="mb-3 h-3 w-28" />
        <Skeleton className="h-12 w-32" />
        <Skeleton className="mt-3 h-3 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-surface p-6">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
