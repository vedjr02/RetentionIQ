"""Refresh materialized views used by dashboard aggregate queries."""

from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings  # noqa: E402

# Order matters — later views depend on earlier ones.
VIEWS = [
    "mv_user_funnel_stages",
    "mv_feature_adoption_weekly",
    "mv_feature_adoption_weekly_by_channel",
    "mv_cohort_retention",
    "mv_cohort_retention_by_channel",
    "mv_cohort_summary",
    "mv_cohort_summary_by_channel",
    "mv_overview_kpis",
]

UPDATE_STATS_SQL = """
UPDATE dashboard_stats
SET
    event_count = (SELECT COUNT(*)::bigint FROM events),
    user_count = (SELECT COUNT(*)::bigint FROM users),
    data_start = (SELECT MIN(event_timestamp)::date FROM events),
    data_end = (SELECT MAX(event_timestamp)::date FROM events),
    updated_at = NOW()
WHERE id = 1
"""


def main() -> None:
    engine = create_engine(settings.resolved_database_url)
    Session = sessionmaker(bind=engine)

    with Session() as session:
        for view in VIEWS:
            print(f"Refreshing {view}...", flush=True)
            session.execute(text(f"REFRESH MATERIALIZED VIEW {view}"))
        print("Updating dashboard_stats cache...", flush=True)
        session.execute(text(UPDATE_STATS_SQL))
        session.commit()

    print("All materialized views refreshed.")


if __name__ == "__main__":
    main()
