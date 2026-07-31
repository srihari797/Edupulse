import { cn } from "@/lib/utils";

interface AIConfidenceBarProps {
  confidence?: number; // 0 to 100
  label?: string;
  className?: string;
}

/** Horizontal confidence indicator bar used on AI Insight Cards */
export function AIConfidenceBar({
  confidence = 90,
  label = "AI Confidence",
  className,
}: AIConfidenceBarProps) {
  const percentage = Math.min(Math.max(confidence, 0), 100);

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <span className="text-[var(--text-muted)] font-mono text-[11px]">
        {label}:
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[var(--text-secondary)] font-mono text-[11px] font-medium">
        {percentage}%
      </span>
    </div>
  );
}
