import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Filter,
  LayoutDashboard,
  LineChart,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "Activation, retention, and adoption at a glance.",
  },
  {
    label: "Funnel",
    href: "/funnel",
    icon: Filter,
    description: "Stage-by-stage conversion and drop-off.",
  },
  {
    label: "Cohorts",
    href: "/cohorts",
    icon: Users,
    description: "Retention curves by signup cohort.",
  },
  {
    label: "Features",
    href: "/features",
    icon: LineChart,
    description: "Feature adoption over time.",
  },
];

export function getPageTitle(pathname: string): string {
  const match = navItems.find((item) => item.href === pathname);
  return match?.label ?? "RetentionIQ";
}

export function getPageDescription(pathname: string): string {
  const match = navItems.find((item) => item.href === pathname);
  return match?.description ?? "Product analytics dashboard";
}

export const overviewIcon = BarChart3;
