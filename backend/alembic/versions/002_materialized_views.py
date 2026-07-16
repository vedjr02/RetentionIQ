"""Materialized views for dashboard aggregate queries

Revision ID: 002
Revises: 001
Create Date: 2026-07-13

"""

from typing import Sequence, Union

from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Per-user funnel stage timestamps — queried on every funnel/overview load
    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_user_funnel_stages AS
        SELECT
            u.id AS user_id,
            u.signup_date,
            u.acquisition_channel,
            MIN(e.event_timestamp) AS signup_ts,
            MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'banner_click') AS activation_ts,
            MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'order') AS conversion_ts
        FROM users u
        JOIN events e ON e.user_id = u.id
        GROUP BY u.id, u.signup_date, u.acquisition_channel
        WITH NO DATA
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX ix_mv_user_funnel_stages_user_id ON mv_user_funnel_stages (user_id)"
    )

    # Cohort retention heatmap cells — cohort x week-since-signup
    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_cohort_retention AS
        WITH cohort_users AS (
            SELECT
                u.id,
                DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
                u.signup_date
            FROM users u
            WHERE u.signup_date IS NOT NULL
        ),
        cohort_sizes AS (
            SELECT cohort_week, COUNT(DISTINCT id) AS cohort_size
            FROM cohort_users
            GROUP BY cohort_week
        ),
        activity AS (
            SELECT
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
                cohort_week,
                week_since_signup,
                COUNT(DISTINCT id) AS retained_users
            FROM activity
            GROUP BY cohort_week, week_since_signup
        )
        SELECT
            r.cohort_week::date AS cohort_week,
            r.week_since_signup,
            cs.cohort_size,
            r.retained_users,
            ROUND(100.0 * r.retained_users / NULLIF(cs.cohort_size, 0), 2) AS retention_rate
        FROM retained r
        JOIN cohort_sizes cs ON cs.cohort_week = r.cohort_week
        WITH NO DATA
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX ix_mv_cohort_retention_key
        ON mv_cohort_retention (cohort_week, week_since_signup)
        """
    )

    # Weekly feature adoption — adoption rate = users who triggered event / active users
    op.execute(
        """
        CREATE MATERIALIZED VIEW mv_feature_adoption_weekly AS
        WITH weekly_activity AS (
            SELECT
                DATE_TRUNC('week', e.event_timestamp) AS activity_week,
                e.user_id
            FROM events e
            GROUP BY DATE_TRUNC('week', e.event_timestamp), e.user_id
        ),
        weekly_active_users AS (
            SELECT activity_week, COUNT(DISTINCT user_id) AS active_users
            FROM weekly_activity
            GROUP BY activity_week
        ),
        feature_users AS (
            SELECT
                DATE_TRUNC('week', e.event_timestamp) AS activity_week,
                e.event_name AS feature,
                COUNT(DISTINCT e.user_id) AS adopting_users
            FROM events e
            GROUP BY DATE_TRUNC('week', e.event_timestamp), e.event_name
        )
        SELECT
            fu.activity_week::date AS week,
            fu.feature,
            fu.adopting_users,
            wau.active_users,
            ROUND(100.0 * fu.adopting_users / NULLIF(wau.active_users, 0), 2) AS adoption_rate
        FROM feature_users fu
        JOIN weekly_active_users wau ON wau.activity_week = fu.activity_week
        WITH NO DATA
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX ix_mv_feature_adoption_weekly_key
        ON mv_feature_adoption_weekly (week, feature)
        """
    )


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_feature_adoption_weekly")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_cohort_retention")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_user_funnel_stages")
