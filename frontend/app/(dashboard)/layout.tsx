import { DashboardShell } from "@/components/layout/dashboard-shell";

/**
 * Dashboard group layout.
 * Wraps every page inside (dashboard)/** with the sidebar + header shell.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
