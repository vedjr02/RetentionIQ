# UI Rules — RetentionIQ

## Design tokens
- Single source of truth in `globals.css` + `tailwind.config.ts`.
- One accent color (amber), used sparingly.
- CSS variables support light/dark mode.

## Typography
- Geist for UI; tabular-nums on KPI values.
- Explicit type scale — no ad hoc font sizes.

## Motion
- 150–400ms durations; ease-out for entry.
- Respect `prefers-reduced-motion`.
- Skeleton loaders, not spinners.
- KPI numbers animate on change.

## States (required on every data view)
1. Loading — skeleton matching layout
2. Empty — reason + next action
3. Error — plain English + retry
4. Populated

## Charts
- Restyle Recharts with design tokens.
- Native tooltips; direct labeling over legends where possible.
- Animate entry once on load.

## Components
- Compose from Button, Card, Badge, KPIStat, Skeleton, EmptyState, InsightPanel.
- Visible focus rings on all interactive elements.

## Signature element
- Retention heatmap hover-scrub with row/column cross-highlight.
- Funnel user-flow drop-off animation.

## Avoid
- Default shadcn look, purple gradients, emoji icons, generic hero sections.
