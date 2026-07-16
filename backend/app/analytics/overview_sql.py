"""Fast overview query using join-based retention (no correlated EXISTS)."""

from __future__ import annotations

# Activation rate = users with banner_click / all users in filter scope
# D7 retention = avg across cohorts of (users active on day 7 / cohort size)
# D30 retention = avg across cohorts of (users active on day 30 / cohort size)
# Top feature adoption = max weekly (feature users / active users) in latest week

OVERVIEW_FAST_SQL = """
WITH filtered_users AS (
    SELECT u.id, u.signup_date, u.acquisition_channel
    FROM users u
    WHERE (CAST(:start_date AS date) IS NULL OR u.signup_date >= CAST(:start_date AS date))
      AND (CAST(:end_date AS date) IS NULL OR u.signup_date <= CAST(:end_date AS date))
      AND (CAST(:channel AS text) IS NULL OR u.acquisition_channel = CAST(:channel AS text))
),
activation AS (
    SELECT
        (SELECT COUNT(*) FROM filtered_users) AS total_users,
        (
            SELECT COUNT(DISTINCT e.user_id)
            FROM events e
            JOIN filtered_users fu ON fu.id = e.user_id
            WHERE e.event_name = 'banner_click'
        ) AS activated_users
),
cohort_users AS (
    SELECT fu.id, DATE_TRUNC('week', fu.signup_date::timestamp) AS cohort_week, fu.signup_date
    FROM filtered_users fu
    WHERE fu.signup_date IS NOT NULL
),
retention_hits AS (
    SELECT
        cu.cohort_week,
        cu.id,
        MAX(CASE WHEN (e.event_timestamp::date - cu.signup_date) = 7 THEN 1 ELSE 0 END) AS hit_d7,
        MAX(CASE WHEN (e.event_timestamp::date - cu.signup_date) = 30 THEN 1 ELSE 0 END) AS hit_d30
    FROM cohort_users cu
    JOIN events e ON e.user_id = cu.id
      AND e.event_timestamp::date BETWEEN cu.signup_date + 7 AND cu.signup_date + 30
    GROUP BY cu.cohort_week, cu.id
),
cohort_retention AS (
    SELECT
        cu.cohort_week,
        COUNT(DISTINCT cu.id) AS cohort_size,
        COUNT(DISTINCT rh.id) FILTER (WHERE rh.hit_d7 = 1) AS d7_users,
        COUNT(DISTINCT rh.id) FILTER (WHERE rh.hit_d30 = 1) AS d30_users
    FROM cohort_users cu
    LEFT JOIN retention_hits rh ON rh.id = cu.id AND rh.cohort_week = cu.cohort_week
    GROUP BY cu.cohort_week
),
retention_avg AS (
    SELECT
        ROUND(AVG(100.0 * d7_users / NULLIF(cohort_size, 0)), 2) AS d7_retention,
        ROUND(AVG(100.0 * d30_users / NULLIF(cohort_size, 0)), 2) AS d30_retention
    FROM cohort_retention
    WHERE cohort_size > 0
),
latest_event_week AS (
    SELECT DATE_TRUNC('week', MAX(e.event_timestamp)) AS week
    FROM events e
    JOIN filtered_users fu ON fu.id = e.user_id
),
weekly_active AS (
    SELECT COUNT(DISTINCT e.user_id) AS active_users
    FROM events e
    JOIN filtered_users fu ON fu.id = e.user_id
    CROSS JOIN latest_event_week lw
    WHERE DATE_TRUNC('week', e.event_timestamp) = lw.week
),
top_feature AS (
    SELECT
        e.event_name AS feature,
        ROUND(
            100.0 * COUNT(DISTINCT e.user_id) / NULLIF(wa.active_users, 0),
            2
        ) AS adoption_rate
    FROM events e
    JOIN filtered_users fu ON fu.id = e.user_id
    CROSS JOIN latest_event_week lw
    CROSS JOIN weekly_active wa
    WHERE DATE_TRUNC('week', e.event_timestamp) = lw.week
    GROUP BY e.event_name, wa.active_users
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
