from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_funnel
from app.database import get_db
from app.schemas.analytics import FunnelResponse, FunnelStage

router = APIRouter(prefix="/api", tags=["funnel"])


@router.get("/funnel", response_model=FunnelResponse)
def get_funnel(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    channel: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> FunnelResponse:
    rows = fetch_funnel(db, start_date, end_date, channel)
    stages = [FunnelStage(**row) for row in rows]
    return FunnelResponse(stages=stages, insight=insights.build_funnel_insight(stages))
