"""Cache acquisition channels on dashboard_stats for fast /api/meta

Revision ID: 006
Revises: 005
Create Date: 2026-07-17

"""

from typing import Sequence, Union

from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE dashboard_stats ADD COLUMN IF NOT EXISTS channels TEXT[] NOT NULL DEFAULT '{}'"
    )
    op.execute(
        """
        UPDATE dashboard_stats
        SET channels = COALESCE((
            SELECT ARRAY_AGG(DISTINCT acquisition_channel ORDER BY acquisition_channel)
            FROM users
            WHERE acquisition_channel IS NOT NULL
        ), '{}')
        WHERE id = 1
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE dashboard_stats DROP COLUMN IF EXISTS channels")
