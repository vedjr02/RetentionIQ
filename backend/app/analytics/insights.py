from __future__ import annotations

from app.schemas.analytics import FunnelStage, InsightPanel, OverviewKPIs


def build_overview_insight(kpis: OverviewKPIs) -> InsightPanel:
    meaning = (
        f"{kpis.activation_rate:.1f}% of users click through banners (activation), "
        f"while D7 retention averages {kpis.d7_retention:.1f}% and D30 {kpis.d30_retention:.1f}%. "
        f"'{kpis.top_feature}' leads feature adoption at {kpis.top_feature_adoption:.1f}% in the latest week."
    )

    if kpis.activation_rate < 15:
        recommendation = (
            "Activation is below 15% — prioritize banner creative and placement tests on the "
            "highest-traffic entry pages before investing in downstream conversion fixes."
        )
    elif kpis.d7_retention < 5:
        recommendation = (
            "Early retention is weak — add a day-1 return trigger (email/push) tied to the "
            "first banner_click to bring users back within the first week."
        )
    else:
        recommendation = (
            f"Double down on '{kpis.top_feature}' — it already shows the strongest weekly adoption. "
            "Route new users into that flow during onboarding."
        )

    return InsightPanel(meaning=meaning, recommendation=recommendation)


def build_funnel_insight(stages: list[FunnelStage]) -> InsightPanel:
    if not stages:
        return InsightPanel(
            meaning="No funnel data available for the selected filters.",
            recommendation="Widen the date range or clear the channel filter to include more users.",
        )

    signup = next((s for s in stages if s.stage == "signup"), None)
    activation = next((s for s in stages if s.stage in ("activation", "banner_click")), None)
    conversion = next((s for s in stages if s.stage in ("paid_conversion", "order")), None)

    if not signup:
        return InsightPanel(
            meaning="Funnel stages are incomplete for the selected filters.",
            recommendation="Widen the date range or clear filters to include signup activity.",
        )

    activation_rate = activation.conversion_rate if activation else 0.0
    conversion_rate = conversion.conversion_rate if conversion else 0.0

    meaning = (
        f"{signup.users:,} users enter the funnel; "
        f"{activation_rate:.1f}% activate via banner_click and "
        f"{conversion_rate:.1f}% complete an order."
    )

    drop_stages = [s for s in stages[1:] if s.dropoff_rate is not None]
    if drop_stages:
        worst = max(drop_stages, key=lambda s: s.dropoff_rate)
        recommendation = (
            f"The largest drop-off is at '{worst.stage}' ({worst.dropoff_rate:.1f}% lost). "
            "Instrument that step and run a focused experiment on friction points there."
        )
    else:
        recommendation = (
            "Review stage definitions and event mapping — drop-off rates are unavailable for this slice."
        )

    return InsightPanel(meaning=meaning, recommendation=recommendation)


def build_cohorts_insight(summary: list, heatmap: list) -> InsightPanel:
    if not summary:
        return InsightPanel(
            meaning="No cohorts match the current filters.",
            recommendation="Try removing the channel filter or expanding the signup date range.",
        )

    best = max(summary, key=lambda row: row["d7_retention"])
    worst = min(summary, key=lambda row: row["d7_retention"])

    meaning = (
        f"Cohort week {best['cohort_week']} retains best at D7 ({best['d7_retention']:.1f}%), "
        f"while {worst['cohort_week']} trails at {worst['d7_retention']:.1f}%."
    )

    recommendation = (
        f"Compare acquisition mix and first-session behavior between "
        f"{best['cohort_week']} and {worst['cohort_week']} to isolate what drove stronger week-one retention."
    )

    return InsightPanel(meaning=meaning, recommendation=recommendation)


def build_features_insight(series: list) -> InsightPanel:
    if not series:
        return InsightPanel(
            meaning="No feature adoption data for the selected filters.",
            recommendation="Clear filters or extend the date range to include weekly activity.",
        )

    latest_week = max(point["week"] for point in series)
    latest = [p for p in series if p["week"] == latest_week]
    leader = max(latest, key=lambda p: p["adoption_rate"])
    laggard = min(latest, key=lambda p: p["adoption_rate"])

    meaning = (
        f"In the week of {latest_week}, '{leader['feature']}' leads at {leader['adoption_rate']:.1f}% adoption "
        f"while '{laggard['feature']}' trails at {laggard['adoption_rate']:.1f}%."
    )

    recommendation = (
        f"Promote '{laggard['feature']}' in the post-activation path — "
        f"its adoption gap vs '{leader['feature']}' suggests discoverability, not lack of demand."
    )

    return InsightPanel(meaning=meaning, recommendation=recommendation)


def build_channel_breakdown_insight(rows: list) -> InsightPanel:
    if not rows:
        return InsightPanel(
            meaning="No channel data matches the current date filters.",
            recommendation="Clear the date range to compare mobile and desktop acquisition performance.",
        )

    leader = max(rows, key=lambda row: row["activation_rate"])
    conversion_leader = max(rows, key=lambda row: row["conversion_rate"])

    meaning = (
        f"'{leader['channel']}' leads activation at {leader['activation_rate']:.1f}% "
        f"({leader['users']:,} users), while '{conversion_leader['channel']}' converts best "
        f"to orders at {conversion_leader['conversion_rate']:.1f}%."
    )

    laggard = min(rows, key=lambda row: row["activation_rate"])
    recommendation = (
        f"Audit the '{laggard['channel']}' onboarding path — it trails '{leader['channel']}' "
        f"by {leader['activation_rate'] - laggard['activation_rate']:.1f} pts on activation. "
        "Align banner placement and first-session UX with the stronger channel."
    )

    return InsightPanel(meaning=meaning, recommendation=recommendation)
