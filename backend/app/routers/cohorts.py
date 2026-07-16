from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_cohort_heatmap, fetch_cohort_summary
from app.database import get_db
from app.schemas.analytics import CohortsResponse

router = APIRouter(prefix="/api", tags=["cohorts"])


@router.get("/cohorts", response_model=CohortsResponse)
def get_cohorts(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    channel: Optional[str] = Query(None),
    max_weeks: int = Query(8, ge=1, le=12),
    db: Session = Depends(get_db),
) -> CohortsResponse:
    summary = fetch_cohort_summary(db, start_date, end_date, channel)
    heatmap = fetch_cohort_heatmap(db, start_date, end_date, channel, max_weeks)
    return CohortsResponse(
        summary=summary,
        heatmap=heatmap,
        insight=insights.build_cohorts_insight(summary, heatmap),
    )
