"""Ensure embedded Postgres is running (for local dev without brew/docker)."""

from __future__ import annotations

import os
from pathlib import Path

import pgserver

PGDATA_DIR = os.environ.get("RETENTIONIQ_PGDATA", "/tmp/retentioniq_pgdata")


def ensure_postgres_running() -> str:
    server = pgserver.get_server(PGDATA_DIR, cleanup_mode=None)
    uri = server.get_uri()
    sqlalchemy_uri = uri.replace("postgresql://", "postgresql+psycopg://")
    return sqlalchemy_uri


def write_env_file(env_path: Path, database_url: str) -> None:
    env_path.write_text(f"DATABASE_URL={database_url}\n", encoding="utf-8")


if __name__ == "__main__":
    backend_root = Path(__file__).resolve().parents[1]
    database_url = ensure_postgres_running()
    write_env_file(backend_root / ".env", database_url)
    print(f"Postgres ready at {PGDATA_DIR}")
    print(f"DATABASE_URL={database_url}")
