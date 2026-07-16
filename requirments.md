# RetentionIQ — Requirements

## Business Objective

Give a SaaS product team visibility into activation, funnel drop-off, and
retention cohorts, so they can prioritize which onboarding/feature fix to
ship next.

## Functional Requirements

1. Data ingestion
   - Load the Kaggle product-analytics event dataset into Postgres.
   - Normalize into an `events` table: user_id, event_name, event_timestamp,
     properties (JSONB).

2. Funnel analysis
   - Define a funnel: signup -> activation_event -> paid_conversion.
   - API endpoint returns conversion rate at each stage, plus drop-off %
     between stages.
   - Support filtering by date range and acquisition channel (if present
     in dataset).

3. Cohort / retention analysis
   - Group users by signup week (or month).
   - Compute D1 / D7 / D30 retention % per cohort.
   - Return data shaped for a retention heatmap (cohort x week-since-signup).

4. Feature adoption
   - Identify top N event types as "features."
   - Compute adoption rate = users who triggered event / total active users,
     per week.

5. Dashboard UI
   - Overview page: 4 KPI cards (activation rate, D7 retention, D30
     retention, top feature adoption).
   - Funnel page: funnel chart with stage-by-stage drop-off %.
   - Cohorts page: retention heatmap.
   - Features page: adoption rate over time, per feature, as line chart.

6. Insight + recommendation panel
   - Each dashboard page includes a short, plain-English "What this means"
     panel and a "Recommended action" panel — not just charts.

## Non-Functional Requirements

- API response time under 500ms for aggregate queries (pre-aggregate in
  Postgres, don't compute cohort math on every request in Python).
- Mobile-responsive dashboard.
- Clean, minimal, Apple-inspired UI.
- All KPI logic must be documented with the formula in a comment.

## Out of Scope

- User authentication / multi-tenant support.
- Real-time event streaming.
- Predictive churn modeling.
