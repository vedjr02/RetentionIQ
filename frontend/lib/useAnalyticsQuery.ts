"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { QueryParams } from "@/lib/api";
import { useDebouncedValue } from "@/lib/useDebouncedValue";

type UseAnalyticsQueryOptions<T> = {
  fetcher: (params: QueryParams, signal: AbortSignal) => Promise<T>;
  params: QueryParams;
  debounceMs?: number;
  enabled?: boolean;
};

function serializeParams(params: QueryParams): string {
  return JSON.stringify({
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
    channel: params.channel ?? null,
  });
}

export function useAnalyticsQuery<T>({
  fetcher,
  params,
  debounceMs = 400,
  enabled = true,
}: UseAnalyticsQueryOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const paramsKey = useMemo(
    () => serializeParams(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialized by field for stable identity
    [params.start_date, params.end_date, params.channel],
  );
  const debouncedParamsKey = useDebouncedValue(paramsKey, debounceMs);
  const stableParams = useMemo(
    () => JSON.parse(debouncedParamsKey) as QueryParams,
    [debouncedParamsKey],
  );

  const retry = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetcher(stableParams, controller.signal)
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
  }, [fetcher, stableParams, reloadKey, enabled]);

  return { data, loading, error, retry };
}
