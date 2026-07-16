# KPI formulas

Every metric shown in the dashboard is computed in SQL (see `backend/app/analytics/queries.py`).
Formulas below match what a recruiter would ask in an interview.

## Funnel

| Stage | Definition |
|---|---|
| **Signup** | User's first recorded event timestamp |
| **Activation** | User triggered `banner_click` at least once |
| **Paid conversion** | User triggered `order` at least once |

| Metric | Formula |
|---|---|
| Stage conversion rate | `users at stage / signup users × 100` |
| Stage drop-off rate | `(users at previous stage − users at stage) / previous stage × 100` |

## Retention

| Metric | Formula |
|---|---|
| **D1 / D7 / D30 retention** | `users active on day N after signup / cohort size × 100` |
| **Overview D7 / D30** | Average of per-cohort D7 (or D30) rates across filtered signup weeks |
| **Heatmap cell** | `users active in week N after signup / cohort size × 100` |

## Feature adoption

| Metric | Formula |
|---|---|
| **Adoption rate** | `users who triggered event in week / active users in week × 100` |
| **Top feature** | Event with highest adoption rate in the latest complete week |

## Overview KPIs

| KPI | Formula |
|---|---|
| **Activation rate** | `users with banner_click / all filtered users × 100` |
| **D7 retention** | Average D7 retention across signup cohort weeks |
| **D30 retention** | Average D30 retention across signup cohort weeks |
| **Top feature adoption** | Adoption rate of the leading event in the latest week |

## Channel breakdown

| Metric | Formula |
|---|---|
| **Activation rate** | `channel users with banner_click / channel users × 100` |
| **Conversion rate** | `channel users with order / channel users × 100` |

## Performance

Aggregate queries use **materialized views** refreshed after data load:

- `mv_user_funnel_stages` — per-user funnel timestamps
- `mv_cohort_retention` / `mv_cohort_summary` — cohort retention
- `mv_feature_adoption_weekly` — weekly feature adoption
- `mv_overview_kpis` — unfiltered overview snapshot

Filtered queries compose MV-backed sub-queries where possible; channel-filtered
cohort/feature queries fall back to live SQL.
