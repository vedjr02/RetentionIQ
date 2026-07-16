"use client";

import { useCallback, useEffect, useState } from "react";

import type { QueryParams } from "@/lib/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type UseAnalyticsQueryOptions<T> = {
  fetcher: (params: QueryParams, signal: AbortSignal) => Promise<T>;
  params: QueryParams;
  debounceMs?: number;
};

export function useAnalyticsQuery<T>({
  fetcher,
  params,
  debounceMs = 400,
}: UseAnalyticsQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const debouncedParams = useDebouncedValue(params, debounceMs);

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetcher(debouncedParams, controller.signal)
      .then((response) => {
        setData(response);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setData(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [fetcher, debouncedParams, reloadKey]);

  return { data, loading, error, retry };
}
