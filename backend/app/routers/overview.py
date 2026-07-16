from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_overview
from app.database import get_db
from app.schemas.analytics import OverviewKPIs, OverviewResponse

router = APIRouter(prefix="/api", tags=["overview"])


@router.get("/overview", response_model=OverviewResponse)
def get_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    channel: Optional[str] = Query(None),
    db: Session = Depends(get_db),
) -> OverviewResponse:
    raw = fetch_overview(db, start_date, end_date, channel)
    kpis = OverviewKPIs(**raw)
    return OverviewResponse(kpis=kpis, insight=insights.build_overview_insight(kpis))
