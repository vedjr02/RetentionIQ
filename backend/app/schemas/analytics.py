from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class OverviewKPIs(BaseModel):
    activation_rate: float = Field(description="% of users who triggered banner_click")
    d7_retention: float = Field(description="Avg D7 retention across signup cohorts")
    d30_retention: float = Field(description="Avg D30 retention across signup cohorts")
    top_feature: str
    top_feature_adoption: float


class InsightPanel(BaseModel):
    meaning: str
    recommendation: str


class FunnelStage(BaseModel):
    stage: str
    users: int
    conversion_rate: float
    dropoff_rate: float


class ChannelBreakdownRow(BaseModel):
    channel: str
    users: int
    activation_rate: float = Field(description="% of users with banner_click")
    conversion_rate: float = Field(description="% of users with order (signup → order)")


class OverviewResponse(BaseModel):
    kpis: OverviewKPIs
    insight: InsightPanel
    funnel_stages: list[FunnelStage]
    channels: list[ChannelBreakdownRow]
    channel_insight: InsightPanel


class FunnelResponse(BaseModel):
    stages: list[FunnelStage]
    insight: InsightPanel


class CohortRow(BaseModel):
    cohort_week: date
    cohort_size: int
    d1_retention: float
    d7_retention: float
    d30_retention: float


class HeatmapCell(BaseModel):
    cohort_week: date
    week_since_signup: int
    cohort_size: int
    retained_users: int
    retention_rate: float


class CohortsResponse(BaseModel):
    summary: list[CohortRow]
    heatmap: list[HeatmapCell]
    insight: InsightPanel


class FeatureAdoptionPoint(BaseModel):
    week: date
    feature: str
    adopting_users: int
    active_users: int
    adoption_rate: float


class FeaturesResponse(BaseModel):
    series: list[FeatureAdoptionPoint]
    insight: InsightPanel


class ChannelsResponse(BaseModel):
    channels: list[str]


class ChannelBreakdownResponse(BaseModel):
    channels: list[ChannelBreakdownRow]
    insight: InsightPanel
