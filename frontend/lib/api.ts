// Production on Vercel: API is same-origin at /api/* (vercel.json rewrites).
// Override with NEXT_PUBLIC_API_URL if API is hosted elsewhere.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000");

export type InsightPanel = {
  meaning: string;
  recommendation: string;
};

export type OverviewResponse = {
  kpis: {
    activation_rate: number;
    d7_retention: number;
    d30_retention: number;
    top_feature: string;
    top_feature_adoption: number;
  };
  insight: InsightPanel;
  funnel_stages: FunnelStage[];
  channels: ChannelBreakdownRow[];
  channel_insight: InsightPanel;
};

export type FunnelStage = {
  stage: string;
  users: number;
  conversion_rate: number;
  dropoff_rate: number;
};

export type FunnelResponse = {
  stages: FunnelStage[];
  insight: InsightPanel;
};

export type CohortRow = {
  cohort_week: string;
  cohort_size: number;
  d1_retention: number;
  d7_retention: number;
  d30_retention: number;
};

export type HeatmapCell = {
  cohort_week: string;
  week_since_signup: number;
  cohort_size: number;
  retained_users: number;
  retention_rate: number;
};

export type CohortsResponse = {
  summary: CohortRow[];
  heatmap: HeatmapCell[];
  insight: InsightPanel;
};

export type FeatureAdoptionPoint = {
  week: string;
  feature: string;
  adopting_users: number;
  active_users: number;
  adoption_rate: number;
};

export type FeaturesResponse = {
  series: FeatureAdoptionPoint[];
  insight: InsightPanel;
};

export type QueryParams = {
  start_date?: string;
  end_date?: string;
  channel?: string;
};

export type MetaResponse = {
  event_count: number;
  user_count: number;
  data_start: string | null;
  data_end: string | null;
  aggregates_ready: boolean;
  channels: string[];
};

export type ChannelBreakdownRow = {
  channel: string;
  users: number;
  activation_rate: number;
  conversion_rate: number;
};

export type ChannelBreakdownResponse = {
  channels: ChannelBreakdownRow[];
  insight: InsightPanel;
};

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.start_date) search.set("start_date", params.start_date);
  if (params.end_date) search.set("end_date", params.end_date);
  if (params.channel) search.set("channel", params.channel);
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function fetchApi<T>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
      cache: "no-store",
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    throw new Error(
      `Cannot reach the API at ${API_BASE}. Start the backend with uvicorn on port 8000.`,
    );
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export function getOverview(params?: QueryParams, signal?: AbortSignal) {
  return fetchApi<OverviewResponse>("/api/overview", params, signal);
}

export function getFunnel(params?: QueryParams, signal?: AbortSignal) {
  return fetchApi<FunnelResponse>("/api/funnel", params, signal);
}

export function getCohorts(params?: QueryParams, signal?: AbortSignal) {
  return fetchApi<CohortsResponse>("/api/cohorts", params, signal);
}

export function getFeatures(params?: QueryParams, signal?: AbortSignal) {
  return fetchApi<FeaturesResponse>("/api/features", params, signal);
}

export function getChannels(signal?: AbortSignal) {
  return fetchApi<{ channels: string[] }>("/api/channels", undefined, signal);
}

export function getMeta(signal?: AbortSignal) {
  return fetchApi<MetaResponse>("/api/meta", undefined, signal);
}

export function getChannelBreakdown(params?: QueryParams, signal?: AbortSignal) {
  return fetchApi<ChannelBreakdownResponse>("/api/channels/breakdown", params, signal);
}
