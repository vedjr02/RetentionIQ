"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "retentioniq-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode === "light") root.classList.add("light");
  else if (mode === "dark") root.classList.add("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
    applyTheme(stored);

    if (stored !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return children;
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
    setMode(stored);
  }, []);

  const cycle = useCallback(() => {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    setMode(next);
  }, [mode]);

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  const label =
    mode === "dark" ? "Dark mode" : mode === "light" ? "Light mode" : "System theme";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={label}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
