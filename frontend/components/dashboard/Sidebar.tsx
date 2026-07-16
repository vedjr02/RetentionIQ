"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen } from "lucide-react";

import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
            <BarChart3 className="h-5 w-5" aria-hidden />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent"
              aria-hidden
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">RetentionIQ</p>
            <p className="text-xs text-muted">Product analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isActive
                  ? "bg-accent-soft text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive ? (
                <span
                  className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-accent"
                  aria-hidden
                />
              ) : null}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-accent" : "text-muted group-hover:text-foreground",
                )}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <Link
          href="/about"
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            pathname === "/about"
              ? "bg-accent-soft text-foreground"
              : "text-muted hover:bg-surface-muted hover:text-foreground",
          )}
        >
          {pathname === "/about" ? (
            <span
              className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-accent"
              aria-hidden
            />
          ) : null}
          <BookOpen
            className={cn(
              "h-4 w-4 shrink-0",
              pathname === "/about" ? "text-accent" : "text-muted group-hover:text-foreground",
            )}
            aria-hidden
          />
          Methodology
        </Link>
      </div>
    </aside>
  );
}
