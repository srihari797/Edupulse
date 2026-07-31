import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Merge Tailwind CSS classes safely.
 * Resolves conflicts (e.g., px-2 + px-4 → px-4) using tailwind-merge,
 * and handles conditional class expressions via clsx.
 *
 * @example cn("px-2 py-1", isActive && "bg-primary", "text-sm")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * formatDate — Format an ISO date string for display.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * formatDateTime — Format an ISO/UTC date-time string into Indian Standard Time (IST - Asia/Kolkata).
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    let isoStr = dateStr;
    if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
      isoStr = dateStr.replace(" ", "T") + "Z";
    }
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dateStr;
  }
}

/**
 * formatRelativeDate — Relative time format ("2 days ago").
 */
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(dateStr);
}

/**
 * getInitials — Extract initials from a name for avatar fallbacks.
 * @example getInitials("Rahul B") → "RB"
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null
): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? "";
  const l = lastName?.charAt(0)?.toUpperCase() ?? "";
  return f + l || "??";
}

/**
 * getRiskVariant — Map a risk level string to a design-system variant.
 */
export function getRiskVariant(
  riskLevel: string
): "danger" | "warning" | "success" {
  const level = riskLevel.toLowerCase();
  if (level === "high") return "danger";
  if (level === "medium") return "warning";
  return "success";
}

/**
 * truncate — Truncate a string to a max length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
