"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Sun, Moon, Bell, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { notificationService } from "@/services/notification.service";
import type { BreadcrumbItem } from "@/types/common.types";

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  notificationCount?: number;
}

export function Header({ breadcrumbs = [], notificationCount }: HeaderProps) {
  const { setCommandPaletteOpen } = useUIStore();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(notificationCount ?? 0);

  useEffect(() => {
    notificationService
      .getNotifications(1, 20)
      .then((res) => {
        if (res.success && res.data) {
          const unread = (res.data.items || []).filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => null);
  }, [pathname]);

  const role = user?.role_id ?? 1;
  const rolePath = role === 1 ? "student" : role === 2 ? "parent" : role === 3 ? "teacher" : "admin";

  const computedBreadcrumbs: BreadcrumbItem[] =
    breadcrumbs.length > 0
      ? breadcrumbs
      : pathname
          .split("/")
          .filter(Boolean)
          .map((segment, idx, arr) => ({
            label:
              segment.charAt(0).toUpperCase() +
              segment.slice(1).replace(/-/g, " "),
            href:
              idx < arr.length - 1
                ? "/" + arr.slice(0, idx + 1).join("/")
                : undefined,
          }));

  return (
    <header className="h-14 flex items-center shrink-0 px-4 gap-3 border-b border-[var(--border)] bg-[var(--background)]">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-sm flex-1 min-w-0"
      >
        {computedBreadcrumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            {idx > 0 && (
              <ChevronRight
                size={13}
                className="text-[var(--text-muted)] shrink-0"
                strokeWidth={1.5}
              />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[var(--text-primary)] font-medium truncate">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Search Bar */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          "hidden md:flex items-center gap-2 h-8 px-3 rounded-md",
          "border border-[var(--border)] bg-[var(--surface)]",
          "text-sm text-[var(--text-muted)]",
          "hover:border-[var(--border-accent)] hover:text-[var(--text-secondary)]",
          "transition-colors duration-150 w-56"
        )}
        aria-label="Open command palette"
      >
        <Search size={13} strokeWidth={1.5} className="shrink-0" />
        <span className="flex-1 text-left text-xs">Search...</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-hover)] rounded px-1 py-0.5">
          ⌘K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun size={15} strokeWidth={1.5} />
          ) : (
            <Moon size={15} strokeWidth={1.5} />
          )}
        </motion.button>

        {/* Notifications Shortcut Link */}
        <Link
          href={`/${rolePath}/notifications`}
          className="relative flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          title="In-App Notifications"
        >
          <Bell size={15} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[9px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User pill */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-[var(--border)]">
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
