"""Overview KPIs and cohort summary materialized views

Revision ID: 003
Revises: 002
Create Date: 2026-07-13

"""

from typing import Sequence, Union

from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_cohort_summary AS
        WITH cohort_users AS (
            SELECT
                u.id,
                DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
                u.signup_date
            FROM users u
            WHERE u.signup_date IS NOT NULL
        ),
        activity AS (
            SELECT
                cu.id,
                cu.cohort_week,
                (e.event_timestamp::date - cu.signup_date) AS day_offset
            FROM cohort_users cu
            JOIN events e ON e.user_id = cu.id
        ),
        cohort_retention AS (
            SELECT
                cohort_week,
                COUNT(DISTINCT id) AS cohort_size,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 1) AS d1_users,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 7) AS d7_users,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 30) AS d30_users
            FROM activity
            GROUP BY cohort_week
        )
        SELECT
            cohort_week::date AS cohort_week,
            cohort_size,
            ROUND(100.0 * d1_users / NULLIF(cohort_size, 0), 2) AS d1_retention,
            ROUND(100.0 * d7_users / NULLIF(cohort_size, 0), 2) AS d7_retention,
            ROUND(100.0 * d30_users / NULLIF(cohort_size, 0), 2) AS d30_retention
        FROM cohort_retention
        WITH NO DATA
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX ix_mv_cohort_summary_week ON mv_cohort_summary (cohort_week)"
    )

    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_overview_kpis AS
        WITH activation AS (
            SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) AS activated_users
            FROM mv_user_funnel_stages
        ),
        retention_avg AS (
            SELECT
                ROUND(AVG(d7_retention), 2) AS d7_retention,
                ROUND(AVG(d30_retention), 2) AS d30_retention
            FROM mv_cohort_summary
        ),
        latest_week AS (
            SELECT MAX(week) AS week FROM mv_feature_adoption_weekly
        ),
        top_feature AS (
            SELECT f.feature, f.adoption_rate
            FROM mv_feature_adoption_weekly f
            JOIN latest_week lw ON f.week = lw.week
            ORDER BY f.adoption_rate DESC
            LIMIT 1
        )
        SELECT
            ROUND(100.0 * a.activated_users / NULLIF(a.total_users, 0), 2) AS activation_rate,
            COALESCE(r.d7_retention, 0) AS d7_retention,
            COALESCE(r.d30_retention, 0) AS d30_retention,
            COALESCE(tf.feature, 'none') AS top_feature,
            COALESCE(tf.adoption_rate, 0) AS top_feature_adoption
        FROM activation a
        CROSS JOIN retention_avg r
        LEFT JOIN top_feature tf ON TRUE
        WITH NO DATA
        """
    )

    op.execute("CREATE INDEX ix_events_user_event ON events (user_id, event_name)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_events_user_event")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_overview_kpis")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_cohort_summary")
