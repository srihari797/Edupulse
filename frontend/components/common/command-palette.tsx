"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  ClipboardList,
  BookOpen,
  CalendarCheck,
  Lightbulb,
  MessageCircleQuestion,
  User,
  HeartPulse,
  Activity,
  Search,
  Bot,
  Bus,
  Users,
  Building2,
  Settings,
  Radar,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import type { RoleId } from "@/types/common.types";

interface NavOption {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

const SEARCH_PAGES: Record<RoleId, NavOption[]> = {
  1: [
    { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "Growth Passport", href: "/student/growth-passport", icon: Trophy, group: "Navigation" },
    { label: "Learning Health Index", href: "/student/learning-health", icon: HeartPulse, group: "Navigation" },
    { label: "Workload Intelligence", href: "/student/workload", icon: Activity, group: "Navigation" },
    { label: "Assignments", href: "/student/assignments", icon: ClipboardList, group: "Academics" },
    { label: "AI Study Plan", href: "/student/study-plan", icon: CalendarCheck, group: "Academics" },
    { label: "Resources", href: "/student/resources", icon: BookOpen, group: "Academics" },
    { label: "Opportunities", href: "/student/opportunities", icon: Lightbulb, group: "Academics" },
    { label: "Ask a Doubt", href: "/student/doubts", icon: MessageCircleQuestion, group: "Academics" },
    { label: "My Profile", href: "/student/profile", icon: User, group: "Account" },
  ],
  2: [
    { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "AI Parent Coach", href: "/parent/ai-coach", icon: Bot, group: "AI Features" },
    { label: "Bus Tracking", href: "/parent/bus-tracking", icon: Bus, group: "Tracking" },
  ],
  3: [
    { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "Risk Alerts", href: "/teacher/risk-alerts", icon: Activity, group: "Alerts" },
    { label: "AI Analytics", href: "/teacher/ai-analytics", icon: HeartPulse, group: "AI Features" },
    { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList, group: "Class Management" },
    { label: "Shared Goals", href: "/teacher/shared-goals", icon: Trophy, group: "Class Management" },
    { label: "Learning Resources", href: "/teacher/resources", icon: BookOpen, group: "Class Management" },
  ],
  4: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "AI Student Radar", href: "/admin/ai-radar", icon: Radar, group: "AI Systems" },
    { label: "User Management", href: "/admin/users", icon: Users, group: "Management" },
    { label: "Classes & Sections", href: "/admin/classes", icon: Building2, group: "Management" },
    { label: "System Settings", href: "/admin/settings", icon: Settings, group: "System" },
  ],
};

/** Global Command Palette (Cmd+K modal) built with cmdk */
export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const role = (user?.role_id ?? 1) as RoleId;
  const options = SEARCH_PAGES[role] ?? SEARCH_PAGES[1];

  // Group items by category
  const groups = Array.from(new Set(options.map((o) => o.group)));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  const handleSelect = (href: string) => {
    setCommandPaletteOpen(false);
    setSearch("");
    router.push(href);
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden z-10"
          >
            <Command className="flex flex-col w-full">
              {/* Search input header */}
              <div className="flex items-center px-4 border-b border-[var(--border)]">
                <Search size={16} className="text-[var(--text-muted)] shrink-0 mr-3" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search page..."
                  className="w-full h-12 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                />
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              </div>

              {/* List items */}
              <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
                <Command.Empty className="py-6 text-center text-sm text-[var(--text-muted)]">
                  No results found.
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[var(--text-muted)] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {options
                      .filter((o) => o.group === group)
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <Command.Item
                            key={item.href}
                            value={item.label}
                            onSelect={() => handleSelect(item.href)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer aria-selected:bg-[var(--surface-hover)] transition-colors"
                          >
                            <Icon size={16} className="text-[var(--primary)] shrink-0" />
                            <span>{item.label}</span>
                          </Command.Item>
                        );
                      })}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
