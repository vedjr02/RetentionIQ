"""SQL queries for analytics endpoints — SQL-first per project rules."""

from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

# Funnel stages for this dataset:
# signup = user's first recorded event (proxy for account/session start)
# activation = banner_click event
# paid_conversion = order event

FUNNEL_SQL = """
WITH filtered_users AS (
    SELECT u.id, u.signup_date, u.acquisition_channel
    FROM users u
    WHERE (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
user_stages AS (
    SELECT
        fu.id,
        MIN(e.event_timestamp) AS signup_ts,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'banner_click') AS activation_ts,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'order') AS conversion_ts
    FROM filtered_users fu
    JOIN events e ON e.user_id = fu.id
    GROUP BY fu.id
),
stage_counts AS (
    SELECT
        COUNT(*) AS signup_count,
        COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) AS activation_count,
        COUNT(*) FILTER (WHERE conversion_ts IS NOT NULL) AS conversion_count
    FROM user_stages
)
SELECT
    signup_count,
    activation_count,
    conversion_count,
    CASE WHEN signup_count > 0
        THEN ROUND(100.0 * activation_count / signup_count, 2) ELSE 0 END AS activation_rate,
    CASE WHEN activation_count > 0
        THEN ROUND(100.0 * conversion_count / activation_count, 2) ELSE 0 END AS activation_to_order_rate,
    CASE WHEN signup_count > 0
        THEN ROUND(100.0 * conversion_count / signup_count, 2) ELSE 0 END AS signup_to_order_rate
FROM stage_counts;
"""

FUNNEL_STAGES_SQL = """
WITH filtered_users AS (
    SELECT u.id, u.signup_date, u.acquisition_channel
    FROM users u
    WHERE (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
user_stages AS (
    SELECT
        fu.id,
        MIN(e.event_timestamp) AS signup_ts,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'banner_click') AS activation_ts,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'order') AS conversion_ts
    FROM filtered_users fu
    JOIN events e ON e.user_id = fu.id
    GROUP BY fu.id
),
stage_counts AS (
    SELECT
        COUNT(*) AS signup_count,
        COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) AS activation_count,
        COUNT(*) FILTER (WHERE conversion_ts IS NOT NULL) AS conversion_count
    FROM user_stages
)
SELECT stage, users, conversion_rate, dropoff_rate
FROM (
    SELECT
        'signup' AS stage,
        1 AS stage_order,
        signup_count AS users,
        100.0 AS conversion_rate,
        0.0 AS dropoff_rate
    FROM stage_counts
    UNION ALL
    SELECT
        'activation',
        2,
        activation_count,
        CASE WHEN signup_count > 0
            THEN ROUND(100.0 * activation_count / signup_count, 2) ELSE 0 END,
        CASE WHEN signup_count > 0
            THEN ROUND(100.0 * (signup_count - activation_count) / signup_count, 2) ELSE 0 END
    FROM stage_counts
    UNION ALL
    SELECT
        'paid_conversion',
        3,
        conversion_count,
        CASE WHEN signup_count > 0
            THEN ROUND(100.0 * conversion_count / signup_count, 2) ELSE 0 END,
        CASE WHEN activation_count > 0
            THEN ROUND(100.0 * (activation_count - conversion_count) / activation_count, 2) ELSE 0 END
    FROM stage_counts
) stages
ORDER BY stage_order;
"""

# D7 retention = users active on day 7 after signup / users in cohort
# D30 retention = users active on day 30 after signup / users in cohort
COHORT_SUMMARY_SQL = """
WITH cohort_users AS (
    SELECT
        u.id,
        DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
        u.signup_date
    FROM users u
    WHERE u.signup_date IS NOT NULL
      AND (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
activity AS (
    SELECT
        cu.id,
        cu.cohort_week,
        (e.event_timestamp::date - cu.signup_date) AS day_offset
    FROM cohort_users cu
    JOIN events e ON e.user_id = cu.id
      AND e.event_timestamp::date BETWEEN cu.signup_date + 1 AND cu.signup_date + 30
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
ORDER BY cohort_week;
"""

COHORT_HEATMAP_SQL = """
WITH cohort_users AS (
    SELECT
        u.id,
        DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
        u.signup_date
    FROM users u
    WHERE u.signup_date IS NOT NULL
      AND (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
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
      AND ((e.event_timestamp::date - cu.signup_date) / 7) <= :max_weeks
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
ORDER BY r.cohort_week, r.week_since_signup;
"""

FEATURE_ADOPTION_SQL = """
WITH filtered_users AS (
    SELECT u.id
    FROM users u
    WHERE (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
weekly_activity AS (
    SELECT
        DATE_TRUNC('week', e.event_timestamp) AS activity_week,
        e.user_id
    FROM events e
    JOIN filtered_users fu ON fu.id = e.user_id
    WHERE (CAST(:start_date AS date) IS NULL OR e.event_timestamp::date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR e.event_timestamp::date <= CAST(:end_date AS date))
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
    JOIN filtered_users fu ON fu.id = e.user_id
    WHERE (CAST(:start_date AS date) IS NULL OR e.event_timestamp::date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR e.event_timestamp::date <= CAST(:end_date AS date))
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
ORDER BY fu.activity_week, fu.feature;
"""

# Activation rate = users with banner_click / all users
# D7/D30 = weighted average of latest complete cohorts
# Top feature adoption = highest adoption rate in most recent week
OVERVIEW_SQL = """
WITH filtered_users AS (
    SELECT u.id
    FROM users u
    WHERE (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
activation AS (
    SELECT
        COUNT(DISTINCT fu.id) AS total_users,
        COUNT(DISTINCT e.user_id) FILTER (WHERE e.event_name = 'banner_click') AS activated_users
    FROM filtered_users fu
    LEFT JOIN events e ON e.user_id = fu.id
),
cohort_retention AS (
    SELECT
        DATE_TRUNC('week', u.signup_date::timestamp) AS cohort_week,
        COUNT(DISTINCT u.id) AS cohort_size,
        COUNT(DISTINCT u.id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM events e
                WHERE e.user_id = u.id
                  AND (e.event_timestamp::date - u.signup_date) = 7
            )
        ) AS d7_users,
        COUNT(DISTINCT u.id) FILTER (
            WHERE EXISTS (
                SELECT 1 FROM events e
                WHERE e.user_id = u.id
                  AND (e.event_timestamp::date - u.signup_date) = 30
            )
        ) AS d30_users
    FROM users u
    WHERE u.signup_date IS NOT NULL
      AND (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
    GROUP BY DATE_TRUNC('week', u.signup_date::timestamp)
),
retention_avg AS (
    SELECT
        ROUND(AVG(100.0 * d7_users / NULLIF(cohort_size, 0)), 2) AS d7_retention,
        ROUND(AVG(100.0 * d30_users / NULLIF(cohort_size, 0)), 2) AS d30_retention
    FROM cohort_retention
    WHERE cohort_size > 0
),
latest_week AS (
    SELECT DATE_TRUNC('week', MAX(event_timestamp)) AS week
    FROM events
),
top_feature AS (
    SELECT
        e.event_name AS feature,
        ROUND(
            100.0 * COUNT(DISTINCT e.user_id)
            / NULLIF((
                SELECT COUNT(DISTINCT e2.user_id)
                FROM events e2
                WHERE DATE_TRUNC('week', e2.event_timestamp) = lw.week
            ), 0),
            2
        ) AS adoption_rate
    FROM events e
    CROSS JOIN latest_week lw
    WHERE DATE_TRUNC('week', e.event_timestamp) = lw.week
    GROUP BY e.event_name, lw.week
    ORDER BY adoption_rate DESC
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
LEFT JOIN top_feature tf ON TRUE;
"""


def _has_filters(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
) -> bool:
    return any(value is not None for value in (start_date, end_date, channel))


FUNNEL_STAGES_MV_SQL = """
WITH filtered AS (
    SELECT *
    FROM mv_user_funnel_stages
    WHERE (CAST(:start_date AS date) IS NULL OR signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR acquisition_channel = CAST(:channel AS text))
),
stage_counts AS (
    SELECT
        COUNT(*) AS signup_count,
        COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) AS activation_count,
        COUNT(*) FILTER (WHERE conversion_ts IS NOT NULL) AS conversion_count
    FROM filtered
)
SELECT stage, users, conversion_rate, dropoff_rate
FROM (
    SELECT 'signup' AS stage, 1 AS stage_order, signup_count AS users,
           100.0 AS conversion_rate, 0.0 AS dropoff_rate FROM stage_counts
    UNION ALL
    SELECT 'activation', 2, activation_count,
           CASE WHEN signup_count > 0 THEN ROUND(100.0 * activation_count / signup_count, 2) ELSE 0 END,
           CASE WHEN signup_count > 0 THEN ROUND(100.0 * (signup_count - activation_count) / signup_count, 2) ELSE 0 END
    FROM stage_counts
    UNION ALL
    SELECT 'paid_conversion', 3, conversion_count,
           CASE WHEN signup_count > 0 THEN ROUND(100.0 * conversion_count / signup_count, 2) ELSE 0 END,
           CASE WHEN activation_count > 0 THEN ROUND(100.0 * (activation_count - conversion_count) / activation_count, 2) ELSE 0 END
    FROM stage_counts
) stages
ORDER BY stage_order;
"""

# Activation rate = users with banner_click / users in channel
# Conversion rate = users with order / users in channel
CHANNEL_BREAKDOWN_MV_SQL = """
WITH filtered AS (
    SELECT *
    FROM mv_user_funnel_stages
    WHERE (CAST(:start_date AS date) IS NULL OR signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR signup_date <= CAST(:end_date AS date))
      AND acquisition_channel IS NOT NULL
)
SELECT
    acquisition_channel AS channel,
    COUNT(*) AS users,
    ROUND(100.0 * COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS activation_rate,
    ROUND(100.0 * COUNT(*) FILTER (WHERE conversion_ts IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS conversion_rate
FROM filtered
GROUP BY acquisition_channel
ORDER BY acquisition_channel;
"""

CHANNEL_BREAKDOWN_SQL = """
WITH filtered_users AS (
    SELECT u.id, u.signup_date, u.acquisition_channel
    FROM users u
    WHERE (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND u.acquisition_channel IS NOT NULL
),
user_stages AS (
    SELECT
        fu.acquisition_channel,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'banner_click') AS activation_ts,
        MIN(e.event_timestamp) FILTER (WHERE e.event_name = 'order') AS conversion_ts
    FROM filtered_users fu
    JOIN events e ON e.user_id = fu.id
    GROUP BY fu.id, fu.acquisition_channel
)
SELECT
    acquisition_channel AS channel,
    COUNT(*) AS users,
    ROUND(100.0 * COUNT(*) FILTER (WHERE activation_ts IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS activation_rate,
    ROUND(100.0 * COUNT(*) FILTER (WHERE conversion_ts IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS conversion_rate
FROM user_stages
GROUP BY acquisition_channel
ORDER BY acquisition_channel;
"""

COHORT_HEATMAP_MV_SQL = """
SELECT cohort_week, week_since_signup, cohort_size, retained_users, retention_rate
FROM mv_cohort_retention
WHERE (CAST(:start_date AS date) IS NULL OR cohort_week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR cohort_week <= CAST(:end_date AS date))
  AND week_since_signup <= :max_weeks
ORDER BY cohort_week, week_since_signup;
"""

COHORT_SUMMARY_MV_SQL = """
SELECT cohort_week, cohort_size, d1_retention, d7_retention, d30_retention
FROM mv_cohort_summary
WHERE (CAST(:start_date AS date) IS NULL OR cohort_week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR cohort_week <= CAST(:end_date AS date))
ORDER BY cohort_week;
"""

OVERVIEW_MV_SQL = """
SELECT
    activation_rate,
    d7_retention,
    d30_retention,
    top_feature,
    top_feature_adoption
FROM mv_overview_kpis
"""

FEATURE_ADOPTION_MV_SQL = """
SELECT week, feature, adopting_users, active_users, adoption_rate
FROM mv_feature_adoption_weekly
WHERE (CAST(:start_date AS date) IS NULL OR week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR week <= CAST(:end_date AS date))
ORDER BY week, feature;
"""

COHORT_SUMMARY_CHANNEL_MV_SQL = """
SELECT cohort_week, cohort_size, d1_retention, d7_retention, d30_retention
FROM mv_cohort_summary_by_channel
WHERE acquisition_channel = CAST(:channel AS text)
  AND (CAST(:start_date AS date) IS NULL OR cohort_week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR cohort_week <= CAST(:end_date AS date))
ORDER BY cohort_week;
"""

COHORT_HEATMAP_CHANNEL_MV_SQL = """
SELECT cohort_week, week_since_signup, cohort_size, retained_users, retention_rate
FROM mv_cohort_retention_by_channel
WHERE acquisition_channel = CAST(:channel AS text)
  AND (CAST(:start_date AS date) IS NULL OR cohort_week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR cohort_week <= CAST(:end_date AS date))
  AND week_since_signup <= :max_weeks
ORDER BY cohort_week, week_since_signup;
"""

FEATURE_ADOPTION_CHANNEL_MV_SQL = """
SELECT week, feature, adopting_users, active_users, adoption_rate
FROM mv_feature_adoption_weekly_by_channel
WHERE acquisition_channel = CAST(:channel AS text)
  AND (CAST(:start_date AS date) IS NULL OR week >= CAST(:start_date AS date))
  AND (CAST(:end_date AS date) IS NULL OR week <= CAST(:end_date AS date))
ORDER BY week, feature;
"""


def _mv_ready(db: Session, view_name: str) -> bool:
    populated = db.execute(
        text("SELECT relispopulated FROM pg_class WHERE relname = :view_name"),
        {"view_name": view_name},
    ).scalar()
    return bool(populated)


def _params(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
    max_weeks: int = 8,
) -> dict:
    return {
        "start_date": start_date,
        "end_date": end_date,
        "channel": channel,
        "max_weeks": max_weeks,
    }


def _avg_retention(summary: list[dict], key: str) -> float:
    if not summary:
        return 0.0
    return round(sum(float(row[key]) for row in summary) / len(summary), 2)


def _top_feature_from_series(series: list[dict]) -> tuple[str, float]:
    if not series:
        return "none", 0.0

    latest_week = max(point["week"] for point in series)
    latest_points = [point for point in series if point["week"] == latest_week]
    top = max(latest_points, key=lambda point: float(point["adoption_rate"]))
    return str(top["feature"]), float(top["adoption_rate"])


def fetch_overview(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
) -> dict:
    if not _has_filters(start_date, end_date, channel) and _mv_ready(db, "mv_overview_kpis"):
        row = db.execute(text(OVERVIEW_MV_SQL)).mappings().one()
        return dict(row)

    funnel_rows = fetch_funnel(db, start_date, end_date, channel)
    activation_stage = next((row for row in funnel_rows if row["stage"] == "activation"), None)
    activation_rate = float(activation_stage["conversion_rate"]) if activation_stage else 0.0

    summary = fetch_cohort_summary(db, start_date, end_date, channel)
    d7_retention = _avg_retention(summary, "d7_retention")
    d30_retention = _avg_retention(summary, "d30_retention")

    series = fetch_feature_adoption(db, start_date, end_date, channel)
    top_feature, top_feature_adoption = _top_feature_from_series(series)

    return {
        "activation_rate": activation_rate,
        "d7_retention": d7_retention,
        "d30_retention": d30_retention,
        "top_feature": top_feature,
        "top_feature_adoption": top_feature_adoption,
    }


def fetch_funnel(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
) -> list[dict]:
    use_mv = _mv_ready(db, "mv_user_funnel_stages")
    sql = FUNNEL_STAGES_MV_SQL if use_mv else FUNNEL_STAGES_SQL
    rows = db.execute(text(sql), _params(start_date, end_date, channel)).mappings().all()
    return [dict(row) for row in rows]


def fetch_cohort_summary(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
) -> list[dict]:
    if channel is not None and _mv_ready(db, "mv_cohort_summary_by_channel"):
        sql = COHORT_SUMMARY_CHANNEL_MV_SQL
    elif channel is None and _mv_ready(db, "mv_cohort_summary"):
        sql = COHORT_SUMMARY_MV_SQL
    else:
        sql = COHORT_SUMMARY_SQL
    rows = db.execute(text(sql), _params(start_date, end_date, channel)).mappings().all()
    return [dict(row) for row in rows]


def fetch_cohort_heatmap(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
    max_weeks: int = 8,
) -> list[dict]:
    if channel is not None and _mv_ready(db, "mv_cohort_retention_by_channel"):
        sql = COHORT_HEATMAP_CHANNEL_MV_SQL
    elif channel is None and _mv_ready(db, "mv_cohort_retention"):
        sql = COHORT_HEATMAP_MV_SQL
    else:
        sql = COHORT_HEATMAP_SQL
    rows = (
        db.execute(text(sql), _params(start_date, end_date, channel, max_weeks))
        .mappings()
        .all()
    )
    return [dict(row) for row in rows]


def fetch_feature_adoption(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel: Optional[str] = None,
) -> list[dict]:
    if channel is not None and _mv_ready(db, "mv_feature_adoption_weekly_by_channel"):
        sql = FEATURE_ADOPTION_CHANNEL_MV_SQL
    elif channel is None and _mv_ready(db, "mv_feature_adoption_weekly"):
        sql = FEATURE_ADOPTION_MV_SQL
    else:
        sql = FEATURE_ADOPTION_SQL
    rows = db.execute(text(sql), _params(start_date, end_date, channel)).mappings().all()
    return [dict(row) for row in rows]


def fetch_channels(db: Session) -> list[str]:
    rows = db.execute(
        text(
            """
            SELECT DISTINCT acquisition_channel
            FROM users
            WHERE acquisition_channel IS NOT NULL
            ORDER BY acquisition_channel
            """
        )
    ).all()
    return [row[0] for row in rows]


def fetch_channel_breakdown(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> list[dict]:
    use_mv = _mv_ready(db, "mv_user_funnel_stages")
    sql = CHANNEL_BREAKDOWN_MV_SQL if use_mv else CHANNEL_BREAKDOWN_SQL
    rows = db.execute(text(sql), _params(start_date, end_date)).mappings().all()
    return [dict(row) for row in rows]
