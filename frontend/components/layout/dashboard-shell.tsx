"use client";

import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { CommandPalette } from "@/components/common/command-palette";
import { Toaster } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { cn } from "@/lib/utils";
import type { RoleId } from "@/types/common.types";
import type { BreadcrumbItem } from "@/types/common.types";

interface DashboardShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  notificationCount?: number;
}

export function DashboardShell({
  children,
  breadcrumbs,
  notificationCount = 0,
}: DashboardShellProps) {
  const { user, initialize, isLoading } = useAuthStore();

  // Re-hydrate session on mount (reads localStorage token → /auth/me)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global keyboard shortcut — Ctrl+K opens command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const role = (user?.role_id ?? 1) as RoleId;

  // Full-page loading state while verifying token
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "#5e6ad2" }}
          >
            <span className="text-white font-bold text-xs">EP</span>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* ── Sidebar ── */}
      <Sidebar role={role} />

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          breadcrumbs={breadcrumbs}
          notificationCount={notificationCount}
        />

        {/* ── Page content ── */}
        <main
          className={cn(
            "flex-1 overflow-y-auto p-6",
            "bg-[var(--background)]",
            "page-enter" // CSS animation from globals.css
          )}
        >
          {children}
        </main>
      </div>

      {/* ── Global Command Palette & Toaster ── */}
      <CommandPalette />
      <Toaster theme="dark" position="bottom-right" richColors />
    </div>
  );
}
