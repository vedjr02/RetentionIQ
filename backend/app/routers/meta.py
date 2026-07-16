from __future__ import annotations

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(prefix="/api", tags=["meta"])


class MetaResponse(BaseModel):
    event_count: int
    user_count: int
    data_start: Optional[date] = None
    data_end: Optional[date] = None
    aggregates_ready: bool
    channels: list[str]


def fetch_meta(db: Session) -> MetaResponse:
    row = db.execute(
        text(
            """
            SELECT
                ds.event_count,
                ds.user_count,
                ds.data_start,
                ds.data_end,
                (SELECT relispopulated FROM pg_class WHERE relname = 'mv_overview_kpis') AS aggregates_ready
            FROM dashboard_stats ds
            WHERE ds.id = 1
            """
        )
    ).mappings().one()

    channels = db.execute(
        text(
            """
            SELECT DISTINCT acquisition_channel
            FROM mv_user_funnel_stages
            WHERE acquisition_channel IS NOT NULL
            ORDER BY acquisition_channel
            """
        )
    ).all()

    return MetaResponse(
        event_count=int(row["event_count"] or 0),
        user_count=int(row["user_count"] or 0),
        data_start=row["data_start"],
        data_end=row["data_end"],
        aggregates_ready=bool(row["aggregates_ready"]),
        channels=[channel[0] for channel in channels],
    )


@router.get("/meta", response_model=MetaResponse)
def get_meta(db: Session = Depends(get_db)) -> MetaResponse:
    return fetch_meta(db)
