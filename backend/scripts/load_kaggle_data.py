"""Load Kaggle product-analytics CSV into RetentionIQ Postgres schema."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from io import StringIO
from pathlib import Path
from typing import Optional

import pandas as pd
from psycopg.types.json import Jsonb
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings  # noqa: E402

COLUMN_MAP = {
    "user_id": "user_id",
    "event_name": "title",
    "event_timestamp": "time",
    "signup_date": None,
    "acquisition_channel": "site_version",
}

PROPERTY_COLUMNS: list[str] = ["order_id", "page_id", "product", "target", "site_version"]
CHUNK_SIZE = 200_000
USER_BATCH_SIZE = 20_000


def parse_timestamp(value: object) -> datetime:
    if pd.isna(value):
        raise ValueError("event_timestamp cannot be null")

    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = pd.to_datetime(value, utc=True, errors="raise").to_pydatetime()

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def resolve_column(df: pd.DataFrame, logical_name: str, csv_column: Optional[str]) -> Optional[str]:
    if csv_column is None:
        return None
    if csv_column not in df.columns:
        print(
            f"[warn] COLUMN_MAP['{logical_name}'] -> '{csv_column}' not found. "
            f"Available columns: {list(df.columns)}"
        )
        return None
    return csv_column


def build_properties(row: pd.Series, property_columns: list[str]) -> Optional[dict]:
    properties: dict[str, object] = {}
    for column in property_columns:
        if column not in row.index:
            continue
        value = row[column]
        if pd.isna(value):
            continue
        if isinstance(value, (pd.Timestamp, datetime)):
            value = value.isoformat()
        properties[column] = value
    return properties or None


def ensure_user_stubs(connection, user_ids: list[str]) -> int:
    if not user_ids:
        return 0

    inserted = 0
    with connection.cursor() as cursor:
        for index in range(0, len(user_ids), USER_BATCH_SIZE):
            batch = user_ids[index : index + USER_BATCH_SIZE]
            cursor.execute(
                """
                INSERT INTO users (id)
                SELECT unnest(%s::text[])
                ON CONFLICT (id) DO NOTHING
                """,
                (batch,),
            )
            inserted += len(batch)
    connection.commit()
    return inserted


def materialize_users_from_events(session: Session) -> int:
    result = session.execute(
        text(
            """
            UPDATE users u
            SET
                signup_date = stats.signup_date,
                acquisition_channel = stats.acquisition_channel
            FROM (
                SELECT
                    e.user_id,
                    MIN(e.event_timestamp::date) AS signup_date,
                    MIN(e.properties->>'site_version') AS acquisition_channel
                FROM events e
                GROUP BY e.user_id
            ) stats
            WHERE u.id = stats.user_id
            """
        )
    )
    session.commit()
    return result.rowcount or 0


def copy_events_chunk(
    connection,
    df: pd.DataFrame,
    column_map: dict[str, Optional[str]],
    property_columns: list[str],
) -> int:
    user_id_col = column_map["user_id"]
    event_name_col = column_map["event_name"]
    event_timestamp_col = column_map["event_timestamp"]

    rows: list[tuple[str, str, datetime, Optional[Jsonb]]] = []
    for record in df.itertuples(index=False):
        row_series = pd.Series(record._asdict())
        properties = build_properties(row_series, property_columns)
        rows.append(
            (
                str(getattr(record, user_id_col)),
                str(getattr(record, event_name_col)),
                parse_timestamp(getattr(record, event_timestamp_col)),
                Jsonb(properties) if properties else None,
            )
        )

    with connection.cursor() as cursor:
        with cursor.copy(
            "COPY events (user_id, event_name, event_timestamp, properties) FROM STDIN"
        ) as copy:
            for row in rows:
                copy.write_row(row)

    connection.commit()
    return len(rows)


def update_dashboard_stats(session: Session) -> None:
    session.execute(
        text(
            """
            UPDATE dashboard_stats
            SET
                event_count = (SELECT COUNT(*)::bigint FROM events),
                user_count = (SELECT COUNT(*)::bigint FROM users),
                data_start = (SELECT MIN(event_timestamp)::date FROM events),
                data_end = (SELECT MAX(event_timestamp)::date FROM events),
                channels = COALESCE((
                    SELECT ARRAY_AGG(DISTINCT acquisition_channel ORDER BY acquisition_channel)
                    FROM users
                    WHERE acquisition_channel IS NOT NULL
                ), '{}'),
                updated_at = NOW()
            WHERE id = 1
            """
        )
    )
    session.commit()


def refresh_aggregates(session: Session) -> None:
    for view in (
        "mv_user_funnel_stages",
        "mv_feature_adoption_weekly",
        "mv_feature_adoption_weekly_by_channel",
        "mv_cohort_retention",
        "mv_cohort_retention_by_channel",
        "mv_cohort_summary",
        "mv_cohort_summary_by_channel",
        "mv_overview_kpis",
    ):
        session.execute(text(f"REFRESH MATERIALIZED VIEW {view}"))
    update_dashboard_stats(session)


def main() -> None:
    parser = argparse.ArgumentParser(description="Load Kaggle product analytics CSV into Postgres.")
    parser.add_argument("--csv-path", required=True, help="Path to the downloaded Kaggle CSV file.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--truncate", action="store_true", help="Clear users/events before loading.")
    parser.add_argument("--refresh-aggregates", action="store_true", help="Refresh materialized views after load.")
    parser.add_argument(
        "--max-chunks",
        type=int,
        default=None,
        help="Stop after N chunks (200k events each). Use 2-3 for Neon free tier (512 MB limit).",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    sample = pd.read_csv(csv_path, nrows=5)
    print(f"Loading {csv_path} with columns: {list(sample.columns)}")

    resolved_map = {
        "user_id": resolve_column(sample, "user_id", COLUMN_MAP["user_id"]),
        "event_name": resolve_column(sample, "event_name", COLUMN_MAP["event_name"]),
        "event_timestamp": resolve_column(sample, "event_timestamp", COLUMN_MAP["event_timestamp"]),
        "signup_date": resolve_column(sample, "signup_date", COLUMN_MAP.get("signup_date")),
        "acquisition_channel": resolve_column(
            sample, "acquisition_channel", COLUMN_MAP.get("acquisition_channel")
        ),
    }

    required = ["user_id", "event_name", "event_timestamp"]
    missing_required = [field for field in required if resolved_map[field] is None]
    if missing_required:
        raise ValueError(
            "Missing required columns after COLUMN_MAP resolution: "
            f"{missing_required}. Update COLUMN_MAP in load_kaggle_data.py."
        )

    if args.dry_run:
        print("Dry run complete — CSV parsed successfully, no database writes performed.")
        print("Resolved column map:", json.dumps(resolved_map, indent=2))
        return

    engine = create_engine(settings.resolved_database_url)
    SessionLocal = sessionmaker(bind=engine)

    total_stubs = 0
    total_events = 0
    chunk_index = 0

    with SessionLocal() as session:
        if args.truncate:
            session.execute(text("TRUNCATE events, users RESTART IDENTITY CASCADE"))
            session.commit()
            print("Truncated users and events tables.")

        raw_connection = engine.raw_connection()
        try:
            for chunk in pd.read_csv(csv_path, chunksize=CHUNK_SIZE):
                chunk_index += 1
                user_ids = chunk[resolved_map["user_id"]].drop_duplicates().astype(str).tolist()
                stubs = ensure_user_stubs(raw_connection, user_ids)
                events = copy_events_chunk(raw_connection, chunk, resolved_map, PROPERTY_COLUMNS)
                total_stubs += stubs
                total_events += events
                print(
                    f"Chunk {chunk_index}: +{events:,} events (running total {total_events:,})",
                    flush=True,
                )
                if chunk_index % 5 == 0:
                    updated = materialize_users_from_events(session)
                    update_dashboard_stats(session)
                    print(f"  refreshed signup metadata for {updated:,} users", flush=True)
                if args.max_chunks is not None and chunk_index >= args.max_chunks:
                    print(f"Stopping at --max-chunks {args.max_chunks} (demo / free-tier load).", flush=True)
                    break
        finally:
            raw_connection.close()

        users_updated = materialize_users_from_events(session)

        if args.refresh_aggregates:
            print("Refreshing materialized views...", flush=True)
            try:
                refresh_aggregates(session)
                print("Materialized views refreshed.", flush=True)
            except Exception as error:
                print(f"[warn] Could not refresh materialized views: {error}", flush=True)

    print(
        f"Done. Ensured {total_stubs:,} user stubs, updated {users_updated:,} users, "
        f"inserted {total_events:,} events."
    )


if __name__ == "__main__":
    main()
