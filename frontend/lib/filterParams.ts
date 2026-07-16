import type { QueryParams } from "@/lib/api";

export function buildFilterQuery(params: QueryParams): string {
  const search = new URLSearchParams();
  if (params.start_date) search.set("start_date", params.start_date);
  if (params.end_date) search.set("end_date", params.end_date);
  if (params.channel) search.set("channel", params.channel);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function buildFilterHref(path: string, params: QueryParams): string {
  return `${path}${buildFilterQuery(params)}`;
}

export function parseFilterParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): QueryParams {
  const start = searchParams.get("start_date");
  const end = searchParams.get("end_date");
  const channel = searchParams.get("channel");

  return {
    start_date: start ?? undefined,
    end_date: end ?? undefined,
    channel: channel ?? undefined,
  };
}
