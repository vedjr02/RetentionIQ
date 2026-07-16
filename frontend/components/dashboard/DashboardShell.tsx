"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { DataFreshnessBadge } from "@/components/dashboard/DataFreshnessBadge";
import { DashboardMetaProvider } from "@/components/dashboard/DashboardMetaContext";

type DashboardShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DashboardShell({ title, description, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <DashboardMetaProvider>
      <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-50 h-full shadow-md">
            <Sidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/95 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="mt-0.5 rounded-md border border-border p-2 text-foreground md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted">{description}</p>
            </div>
            <DataFreshnessBadge />
          </div>
        </header>

        <motion.main
          key={title}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 space-y-6 px-4 py-6 md:px-8 md:py-8"
        >
          {children}
        </motion.main>
      </div>
      </div>
    </DashboardMetaProvider>
  );
}
