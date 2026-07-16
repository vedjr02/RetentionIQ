export const DATE_PRESETS = [
  { label: "All time", start: undefined, end: undefined },
  { label: "Jan 2019", start: "2019-01-01", end: "2019-01-31" },
  { label: "Feb 2019", start: "2019-02-01", end: "2019-02-28" },
  { label: "Mar 2019", start: "2019-03-01", end: "2019-03-31" },
  { label: "Q1 2019", start: "2019-01-01", end: "2019-03-31" },
  { label: "Full dataset", start: "2019-01-01", end: "2019-05-31" },
] as const;
