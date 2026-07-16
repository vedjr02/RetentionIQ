"""Channel-aware MVs and cached dashboard stats

Revision ID: 004
Revises: 003
Create Date: 2026-07-13

"""

from typing import Sequence, Union

from alembic import op

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE dashboard_stats (
            id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
            event_count BIGINT NOT NULL DEFAULT 0,
            user_count BIGINT NOT NULL DEFAULT 0,
            data_start DATE,
            data_end DATE,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("INSERT INTO dashboard_stats (id) VALUES (1)")

    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_cohort_summary_by_channel AS
        WITH cohort_users AS (
            SELECT
                u.id,
                u.acquisition_channel,
                DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
                u.signup_date
            FROM users u
            WHERE u.signup_date IS NOT NULL
              AND u.acquisition_channel IS NOT NULL
        ),
        activity AS (
            SELECT
                cu.id,
                cu.acquisition_channel,
                cu.cohort_week,
                (e.event_timestamp::date - cu.signup_date) AS day_offset
            FROM cohort_users cu
            JOIN events e ON e.user_id = cu.id
              AND e.event_timestamp::date BETWEEN cu.signup_date + 1 AND cu.signup_date + 30
        ),
        cohort_retention AS (
            SELECT
                acquisition_channel,
                cohort_week,
                COUNT(DISTINCT id) AS cohort_size,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 1) AS d1_users,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 7) AS d7_users,
                COUNT(DISTINCT id) FILTER (WHERE day_offset = 30) AS d30_users
            FROM activity
            GROUP BY acquisition_channel, cohort_week
        )
        SELECT
            acquisition_channel,
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
        """
        CREATE UNIQUE INDEX ix_mv_cohort_summary_by_channel_key
        ON mv_cohort_summary_by_channel (acquisition_channel, cohort_week)
        """
    )

    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_cohort_retention_by_channel AS
        WITH cohort_users AS (
            SELECT
                u.id,
                u.acquisition_channel,
                DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
                u.signup_date
            FROM users u
            WHERE u.signup_date IS NOT NULL
              AND u.acquisition_channel IS NOT NULL
        ),
        cohort_sizes AS (
            SELECT acquisition_channel, cohort_week, COUNT(DISTINCT id) AS cohort_size
            FROM cohort_users
            GROUP BY acquisition_channel, cohort_week
        ),
        activity AS (
            SELECT
                cu.acquisition_channel,
                cu.cohort_week,
                ((e.event_timestamp::date - cu.signup_date) / 7) AS week_since_signup,
                cu.id
            FROM cohort_users cu
            JOIN events e ON e.user_id = cu.id
            WHERE (e.event_timestamp::date - cu.signup_date) >= 0
              AND ((e.event_timestamp::date - cu.signup_date) / 7) <= 12
        ),
        retained AS (
            SELECT
                acquisition_channel,
                cohort_week,
                week_since_signup,
                COUNT(DISTINCT id) AS retained_users
            FROM activity
            GROUP BY acquisition_channel, cohort_week, week_since_signup
        )
        SELECT
            r.acquisition_channel,
            r.cohort_week::date AS cohort_week,
            r.week_since_signup,
            cs.cohort_size,
            r.retained_users,
            ROUND(100.0 * r.retained_users / NULLIF(cs.cohort_size, 0), 2) AS retention_rate
        FROM retained r
        JOIN cohort_sizes cs
          ON cs.acquisition_channel = r.acquisition_channel
         AND cs.cohort_week = r.cohort_week
        WITH NO DATA
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX ix_mv_cohort_retention_by_channel_key
        ON mv_cohort_retention_by_channel (acquisition_channel, cohort_week, week_since_signup)
        """
    )

    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_feature_adoption_weekly_by_channel AS
        WITH weekly_activity AS (
            SELECT
                DATE_TRUNC('week', e.event_timestamp) AS activity_week,
                e.user_id,
                u.acquisition_channel
            FROM events e
            JOIN users u ON u.id = e.user_id
            WHERE u.acquisition_channel IS NOT NULL
            GROUP BY DATE_TRUNC('week', e.event_timestamp), e.user_id, u.acquisition_channel
        ),
        weekly_active_users AS (
            SELECT activity_week, acquisition_channel, COUNT(DISTINCT user_id) AS active_users
            FROM weekly_activity
            GROUP BY activity_week, acquisition_channel
        ),
        feature_users AS (
            SELECT
                DATE_TRUNC('week', e.event_timestamp) AS activity_week,
                u.acquisition_channel,
                e.event_name AS feature,
                COUNT(DISTINCT e.user_id) AS adopting_users
            FROM events e
            JOIN users u ON u.id = e.user_id
            WHERE u.acquisition_channel IS NOT NULL
            GROUP BY DATE_TRUNC('week', e.event_timestamp), u.acquisition_channel, e.event_name
        )
        SELECT
            fu.activity_week::date AS week,
            fu.acquisition_channel,
            fu.feature,
            fu.adopting_users,
            wau.active_users,
            ROUND(100.0 * fu.adopting_users / NULLIF(wau.active_users, 0), 2) AS adoption_rate
        FROM feature_users fu
        JOIN weekly_active_users wau
          ON wau.activity_week = fu.activity_week
         AND wau.acquisition_channel = fu.acquisition_channel
        WITH NO DATA
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX ix_mv_feature_adoption_weekly_by_channel_key
        ON mv_feature_adoption_weekly_by_channel (week, acquisition_channel, feature)
        """
    )


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_feature_adoption_weekly_by_channel")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_cohort_retention_by_channel")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_cohort_summary_by_channel")
    op.execute("DROP TABLE IF EXISTS dashboard_stats")
