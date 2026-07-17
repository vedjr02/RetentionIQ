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


def _live_stats(db: Session) -> dict:
    return db.execute(
        text(
            """
            SELECT
                (SELECT COUNT(*)::bigint FROM events) AS event_count,
                (SELECT COUNT(*)::bigint FROM users) AS user_count,
                (SELECT MIN(event_timestamp)::date FROM events) AS data_start,
                (SELECT MAX(event_timestamp)::date FROM events) AS data_end
            """
        )
    ).mappings().one()


def fetch_meta(db: Session) -> MetaResponse:
    # Single-row cache read — avoids DISTINCT scans over millions of users/MV rows.
    row = db.execute(
        text(
            """
            SELECT
                ds.event_count,
                ds.user_count,
                ds.data_start,
                ds.data_end,
                COALESCE(ds.channels, '{}') AS channels,
                (SELECT relispopulated FROM pg_class WHERE relname = 'mv_overview_kpis') AS aggregates_ready
            FROM dashboard_stats ds
            WHERE ds.id = 1
            """
        )
    ).mappings().one()

    event_count = int(row["event_count"] or 0)
    user_count = int(row["user_count"] or 0)
    data_start = row["data_start"]
    data_end = row["data_end"]
    channels = list(row["channels"] or [])

    # During data load the cache may be stale — fall back to live table counts.
    if event_count == 0:
        live = _live_stats(db)
        live_events = int(live["event_count"] or 0)
        if live_events > 0:
            event_count = live_events
            user_count = int(live["user_count"] or 0)
            data_start = live["data_start"]
            data_end = live["data_end"]

    if not channels:
        channels = [
            r[0]
            for r in db.execute(
                text(
                    """
                    SELECT DISTINCT acquisition_channel
                    FROM users
                    WHERE acquisition_channel IS NOT NULL
                    ORDER BY acquisition_channel
                    LIMIT 20
                    """
                )
            ).all()
        ]

    return MetaResponse(
        event_count=event_count,
        user_count=user_count,
        data_start=data_start,
        data_end=data_end,
        aggregates_ready=bool(row["aggregates_ready"]),
        channels=channels,
    )


@router.get("/meta", response_model=MetaResponse)
def get_meta(db: Session = Depends(get_db)) -> MetaResponse:
    return fetch_meta(db)
