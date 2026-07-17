from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_channel_breakdown, fetch_funnel, fetch_overview
from app.database import get_db
from app.schemas.analytics import (
    ChannelBreakdownRow,
    FunnelStage,
    OverviewKPIs,
    OverviewResponse,
)

router = APIRouter(prefix="/api", tags=["overview"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    channel: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    # Fetch funnel once and reuse for KPI activation_rate (avoids duplicate query).
    funnel_rows = fetch_funnel(db, start_date, end_date, channel)
    channel_rows = fetch_channel_breakdown(db, start_date, end_date)
    raw = fetch_overview(
        db,
        start_date,
        end_date,
        channel,
        funnel_rows=funnel_rows,
    )
    kpis = OverviewKPIs(**raw)
    return OverviewResponse(
        kpis=kpis,
        insight=insights.build_overview_insight(kpis),
        funnel_stages=[FunnelStage(**row) for row in funnel_rows],
        channels=[ChannelBreakdownRow(**row) for row in channel_rows],
        channel_insight=insights.build_channel_breakdown_insight(channel_rows),
    )
