import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string | number;
  deltaType?: "positive" | "negative" | "warning" | "neutral";
  subtitle?: string;
  icon?: React.ElementType;
  accentColor?: string;
  className?: string;
}

/**
 * KpiCard — Stripe-style key metric card.
 * Minimal border, high contrast metric typography (Geist Mono), optional delta indicator.
 */
export function KpiCard({
  title,
  value,
  unit,
  delta,
  deltaType = "positive",
  subtitle,
  icon: Icon,
  accentColor,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-4 rounded-lg",
        "border border-[var(--border)] bg-[var(--surface)]",
        "hover:border-[var(--border-accent)] transition-colors duration-150",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
          {title}
        </span>
        {Icon && (
          <div
            className="flex items-center justify-center w-6 h-6 rounded shrink-0 bg-[var(--surface-hover)] text-[var(--text-secondary)]"
            style={accentColor ? { color: accentColor } : undefined}
          >
            <Icon size={14} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Main Metric */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="metric text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {unit}
          </span>
        )}
      </div>

      {/* Footer / Delta */}
      {(delta || subtitle) && (
        <div className="flex items-center gap-2 mt-1 text-[11px]">
          {delta && (
            <span
              className={cn(
                "font-mono font-medium px-1 py-0.5 rounded",
                deltaType === "positive" && "text-[var(--success)] bg-[var(--success)]/10",
                deltaType === "warning" && "text-[var(--warning)] bg-[var(--warning)]/10",
                deltaType === "negative" && "text-[var(--danger)] bg-[var(--danger)]/10",
                deltaType === "neutral" && "text-[var(--text-muted)] bg-[var(--surface-hover)]"
              )}
            >
              {delta}
            </span>
          )}
          {subtitle && (
            <span className="text-[var(--text-muted)] truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
