import { cn } from "@/lib/utils";

interface StatusDotProps {
  status?: "active" | "healthy" | "warning" | "danger" | "offline";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const colorMap = {
  active: "bg-[var(--success)]",
  healthy: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
  offline: "bg-[var(--text-muted)]",
};

const sizeMap = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

/** Live colored dot indicator with optional pulse ring animation */
export function StatusDot({
  status = "active",
  size = "md",
  pulse = true,
  className,
}: StatusDotProps) {
  const color = colorMap[status];

  return (
    <span className={cn("relative flex items-center justify-center shrink-0", sizeMap[size], className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            color
          )}
        />
      )}
      <span className={cn("relative inline-flex rounded-full h-full w-full", color)} />
    </span>
  );
}
