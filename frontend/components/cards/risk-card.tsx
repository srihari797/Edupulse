import { AlertTriangle, ShieldAlert } from "lucide-react";
import { RiskBadge } from "@/components/common/badge";
import { cn } from "@/lib/utils";

interface RiskCardProps {
  studentName: string;
  riskLevel: "High" | "Medium" | "Low" | string;
  reason: string;
  metricTriggered?: string;
  alertDate?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * RiskCard — Teacher & Admin risk alert container card.
 * Red highlight border for High risk, Amber for Medium risk, Green for Low risk.
 */
export function RiskCard({
  studentName,
  riskLevel,
  reason,
  metricTriggered,
  alertDate,
  actions,
  className,
}: RiskCardProps) {
  const isHigh = riskLevel === "High";
  const isMedium = riskLevel === "Medium";

  return (
    <div
      className={cn(
        "p-4 rounded-lg border flex flex-col justify-between space-y-3 transition-colors",
        isHigh && "risk-high border-[var(--danger)]/30",
        isMedium && "risk-medium border-[var(--warning)]/30",
        !isHigh && !isMedium && "risk-low border-[var(--success)]/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-1.5 rounded shrink-0",
              isHigh && "bg-[var(--danger)]/15 text-[var(--danger)]",
              isMedium && "bg-[var(--warning)]/15 text-[var(--warning)]",
              !isHigh && !isMedium && "bg-[var(--success)]/15 text-[var(--success)]"
            )}
          >
            {isHigh ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              {studentName}
            </h4>
            {metricTriggered && (
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">
                Trigger: {metricTriggered}
              </span>
            )}
          </div>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      {/* Reason Narrative */}
      <p className="text-xs text-[var(--text-primary)] leading-relaxed">
        {reason}
      </p>

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        {alertDate ? <span>Alerted: {alertDate}</span> : <span />}
        {actions}
      </div>
    </div>
  );
}
