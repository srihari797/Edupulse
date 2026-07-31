"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Users,
  AlertTriangle,
  Target,
  Library,
  BrainCircuit,
  Baby,
  Bus,
  Bot,
  ShieldCheck,
  GraduationCap,
  BookMarked,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Radar,
  Award,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { ROLES, ROLE_NAMES } from "@/lib/constants";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import type { RoleId } from "@/types/common.types";

// ─────────────────────────────────────────────────────────────────────────────
// Nav item type
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  shortcut?: string;
}

interface NavSection {
  section?: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Role-specific navigation definitions
// ─────────────────────────────────────────────────────────────────────────────

const NAV_CONFIG: Record<RoleId, NavSection[]> = {
  [ROLES.STUDENT]: [
    {
      items: [
        { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, shortcut: "G D" },
        { label: "Growth Passport", href: "/student/growth-passport", icon: Trophy, shortcut: "G G" },
        { label: "Learning Health", href: "/student/learning-health", icon: HeartPulse, shortcut: "G H" },
        { label: "Workload", href: "/student/workload", icon: Activity, shortcut: "G W" },
      ],
    },
    {
      section: "Academics",
      items: [
        { label: "Assignments", href: "/student/assignments", icon: ClipboardList, shortcut: "G A" },
        { label: "Timetable", href: "/student/timetable", icon: CalendarCheck, shortcut: "G T" },
        { label: "Study Plan", href: "/student/study-plan", icon: CalendarCheck, shortcut: "G S" },
        { label: "Resources", href: "/student/resources", icon: BookOpen, shortcut: "G R" },
        { label: "Opportunities", href: "/student/opportunities", icon: Lightbulb, shortcut: "G O" },
        { label: "Doubts", href: "/student/doubts", icon: MessageCircleQuestion, shortcut: "G B" },
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Profile", href: "/student/profile", icon: User },
      ],
    },
  ],

  [ROLES.TEACHER]: [
    {
      items: [
        { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard, shortcut: "G D" },
        { label: "Risk Alerts", href: "/teacher/risk-alerts", icon: AlertTriangle, shortcut: "G R" },
        { label: "AI Analytics", href: "/teacher/ai-analytics", icon: BrainCircuit, shortcut: "G I" },
      ],
    },
    {
      section: "Class Management",
      items: [
        { label: "My Classes & Timetable", href: "/teacher/classes", icon: Building2 },
        { label: "Students Roster", href: "/teacher/students", icon: Users, shortcut: "G S" },
        { label: "Timetable", href: "/teacher/timetable", icon: CalendarCheck, shortcut: "G T" },
        { label: "Assignments", href: "/teacher/assignments", icon: ClipboardList, shortcut: "G A" },
        { label: "Class Tests", href: "/teacher/tests", icon: CalendarCheck },
        { label: "Submissions", href: "/teacher/submissions", icon: Award },
        { label: "Student Doubts", href: "/teacher/doubts", icon: MessageCircleQuestion, shortcut: "G B" },
        { label: "Shared Goals", href: "/teacher/shared-goals", icon: Target, shortcut: "G G" },
        { label: "Resources", href: "/teacher/resources", icon: Library, shortcut: "G L" },
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Profile", href: "/teacher/profile", icon: User },
      ],
    },
  ],

  [ROLES.PARENT]: [
    {
      items: [
        { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard, shortcut: "G D" },
        { label: "AI Coach", href: "/parent/ai-coach", icon: Bot, shortcut: "G C" },
        { label: "Bus Tracking", href: "/parent/bus-tracking", icon: Bus, shortcut: "G B" },
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Profile", href: "/parent/profile", icon: User },
      ],
    },
  ],

  [ROLES.ADMIN]: [
    {
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, shortcut: "G D" },
        { label: "AI Radar", href: "/admin/ai-radar", icon: Radar, shortcut: "G R" },
      ],
    },
    {
      section: "User Management",
      items: [
        { label: "Users", href: "/admin/users", icon: Users, shortcut: "G U" },
        { label: "Student Management", href: "/admin/student-management", icon: GraduationCap },
      ],
    },
    {
      section: "Academics",
      items: [
        { label: "Classes", href: "/admin/classes", icon: Building2 },
        { label: "Academics", href: "/admin/academics", icon: BookMarked },
        { label: "Timetable", href: "/admin/timetable", icon: CalendarCheck },
        { label: "Calendar", href: "/admin/calendar", icon: Baby },
      ],
    },
    {
      section: "System",
      items: [
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ],
};

// Role accent colors matching the design system
const ROLE_ACCENT: Record<RoleId, string> = {
  1: "#5e6ad2",
  2: "#10b981",
  3: "#3b82f6",
  4: "#f59e0b",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: RoleId;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navSections = NAV_CONFIG[role] ?? [];
  const initials = getInitials(user?.first_name, user?.last_name);
  const accentColor = ROLE_ACCENT[role];

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative flex flex-col h-screen bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden shrink-0"
    >
      {/* ── Logo / Brand ── */}
      <div className="flex items-center h-14 px-4 border-b border-[var(--border)] shrink-0">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-white font-bold text-xs">EP</span>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="ml-2.5 font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap tracking-tight"
            >
              EduPulse
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {navSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-1">
            {/* Section label */}
            {section.section && !sidebarCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider"
              >
                {section.section}
              </motion.p>
            )}
            {section.section && sidebarCollapsed && (
              <div className="my-2 mx-2 h-px bg-[var(--border)]" />
            )}

            {/* Nav items */}
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                    isActive
                      ? "bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}

                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                    )}
                    style={isActive ? { color: accentColor } : undefined}
                  />

                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="flex-1 whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Shortcut badge — only in expanded mode */}
                  <AnimatePresence>
                    {!sidebarCollapsed && item.shortcut && isActive && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[10px] font-mono text-[var(--text-muted)] tracking-wide"
                      >
                        {item.shortcut}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="border-t border-[var(--border)] p-2 shrink-0">
        {/* Role badge */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-2 py-1.5 mb-1"
            >
              <span
                className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}18`,
                }}
              >
                {ROLE_NAMES[role]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User info row */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--surface-hover)] transition-colors cursor-default">
          {/* Avatar */}
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {initials}
          </div>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign out"
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
              >
                <LogOut size={13} strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications shortcut */}
        <Link
          href={`/${role === 1 ? "student" : role === 2 ? "parent" : role === 3 ? "teacher" : "admin"}/notifications`}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md mt-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
          title={sidebarCollapsed ? "Notifications" : undefined}
        >
          <Bell size={16} strokeWidth={1.5} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm"
              >
                Notifications
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute top-[52px] -right-3 z-10",
          "flex items-center justify-center w-6 h-6 rounded-full",
          "bg-[var(--surface)] border border-[var(--border)]",
          "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          "hover:bg-[var(--surface-hover)] transition-colors"
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={12} strokeWidth={2} />
        ) : (
          <ChevronLeft size={12} strokeWidth={2} />
        )}
      </button>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-[var(--danger)]/10 text-[var(--danger)]">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Confirm Logout</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Are you sure you want to sign out of EduPulse?</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-3.5 py-1.5 rounded text-xs font-medium bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
