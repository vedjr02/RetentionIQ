"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { QueryParams } from "@/lib/api";
import { parseFilterParams } from "@/lib/filterParams";

type DashboardFilterContextValue = {
  params: QueryParams;
  setParams: (params: QueryParams) => void;
};

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => parseFilterParams(searchParams),
    [searchParams],
  );

  const setParams = useCallback(
    (next: QueryParams) => {
      const sp = new URLSearchParams();
      if (next.start_date) sp.set("start_date", next.start_date);
      if (next.end_date) sp.set("end_date", next.end_date);
      if (next.channel) sp.set("channel", next.channel);
      const query = sp.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  return (
    <DashboardFilterContext.Provider value={{ params, setParams }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error("useDashboardFilters must be used within DashboardFilterProvider");
  }
  return context;
}
