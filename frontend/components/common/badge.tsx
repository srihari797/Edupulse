import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
        primary:
          "bg-[var(--primary)]/10 text-[var(--primary)]",
        success:
          "bg-[var(--success)]/12 text-[var(--success)]",
        warning:
          "bg-[var(--warning)]/12 text-[var(--warning)]",
        danger:
          "bg-[var(--danger)]/12 text-[var(--danger)]",
        info:
          "bg-[var(--info)]/12 text-[var(--info)]",
        outline:
          "border border-[var(--border)] text-[var(--text-secondary)] bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** Status badge — rendered as an inline span with semantic color variants */
export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

/** Convenience: maps risk level string to badge variant */
export function RiskBadge({ level }: { level: string }) {
  const variant =
    level === "High" ? "danger" : level === "Medium" ? "warning" : "success";
  return <Badge variant={variant}>{level}</Badge>;
}

/** Convenience: maps assignment/doubt status strings to badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    Published: "success",
    Draft: "default",
    Closed: "outline",
    Submitted: "primary",
    Graded: "success",
    Pending: "warning",
    Resolved: "success",
    Active: "success",
    Completed: "primary",
    Cancelled: "outline",
  };
  return <Badge variant={map[status] ?? "default"}>{status}</Badge>;
}
