from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_channel_breakdown, fetch_channels
from app.database import get_db
from app.schemas.analytics import ChannelBreakdownResponse, ChannelsResponse

router = APIRouter(prefix="/api", tags=["channels"])


@router.get("/channels", response_model=ChannelsResponse)
def get_channels(db: Session = Depends(get_db)) -> ChannelsResponse:
    return ChannelsResponse(channels=fetch_channels(db))


@router.get("/channels/breakdown", response_model=ChannelBreakdownResponse)
def get_channel_breakdown(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
) -> ChannelBreakdownResponse:
    rows = fetch_channel_breakdown(db, start_date, end_date)
    return ChannelBreakdownResponse(
        channels=rows,
        insight=insights.build_channel_breakdown_insight(rows),
    )
