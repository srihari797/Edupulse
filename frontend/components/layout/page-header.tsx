import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — Consistent section title for every dashboard page.
 * Uses the same typographic scale defined in the design system.
 *
 * @example
 * <PageHeader
 *   title="Growth Passport"
 *   subtitle="Your holistic development overview"
 *   actions={<Button>Generate Report</Button>}
 * />
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
