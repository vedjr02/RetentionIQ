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
    db: Session = Depends(get_db),
) -> FeaturesResponse:
    series = fetch_feature_adoption(db, start_date, end_date, channel)
    return FeaturesResponse(series=series, insight=insights.build_features_insight(series))
