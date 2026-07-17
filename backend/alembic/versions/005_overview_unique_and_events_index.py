"""Unique index for concurrent overview MV refresh + events composite index

Revision ID: 005
Revises: 004
Create Date: 2026-07-17

"""

from typing import Sequence, Union

from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Single-row MV needs a unique index for REFRESH ... CONCURRENTLY.
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_mv_overview_kpis ON mv_overview_kpis ((TRUE))"
    )
    # Speeds filtered feature-adoption scans (timestamp range + event_name grouping).
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS ix_events_timestamp_name_user
        ON events (event_timestamp, event_name, user_id)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_events_timestamp_name_user")
    op.execute("DROP INDEX IF EXISTS ux_mv_overview_kpis")
