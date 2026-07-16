"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getMeta, type MetaResponse } from "@/lib/api";

type DashboardMetaContextValue = {
  meta: MetaResponse | null;
  loading: boolean;
};

const DashboardMetaContext = createContext<DashboardMetaContextValue>({
  meta: null,
  loading: true,
});

export function DashboardMetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeta()
      .then(setMeta)
      .catch(() => setMeta(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardMetaContext.Provider value={{ meta, loading }}>
      {children}
    </DashboardMetaContext.Provider>
  );
}

export function useDashboardMeta() {
  return useContext(DashboardMetaContext);
}
