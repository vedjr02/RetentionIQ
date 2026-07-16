"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getMeta, type MetaResponse } from "@/lib/api";

type DashboardMetaContextValue = {
  meta: MetaResponse | null;
  loading: boolean;
  refresh: () => void;
};

const DashboardMetaContext = createContext<DashboardMetaContextValue>({
  meta: null,
  loading: true,
  refresh: () => undefined,
});

const POLL_INTERVAL_MS = 10_000;

export function DashboardMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = () =>
      getMeta()
        .then((response) => {
          if (!cancelled) setMeta(response);
        })
        .catch(() => {
          if (!cancelled) setMeta(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

    setLoading(true);
    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!meta || meta.event_count > 0) return undefined;

    const timer = window.setInterval(() => {
      getMeta()
        .then(setMeta)
        .catch(() => setMeta(null));
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [meta]);

  return (
    <DashboardMetaContext.Provider value={{ meta, loading, refresh }}>
      {children}
    </DashboardMetaContext.Provider>
  );
}

export function useDashboardMeta() {
  return useContext(DashboardMetaContext);
}
