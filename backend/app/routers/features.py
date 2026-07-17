from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.analytics import insights
from app.analytics.queries import fetch_feature_adoption
from app.database import get_db
from app.schemas.analytics import FeaturesResponse

router = APIRouter(prefix="/api", tags=["features"])


@router.get("/features", response_model=FeaturesResponse)
def get_features(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    channel: Optional[str] = Query(None),
    top_n: int = Query(10, ge=1, le=50, description="Top N features by latest-week adoption"),
    db: Session = Depends(get_db),
) -> FeaturesResponse:
    series = fetch_feature_adoption(db, start_date, end_date, channel, top_n=top_n)
    return FeaturesResponse(series=series, insight=insights.build_features_insight(series))
