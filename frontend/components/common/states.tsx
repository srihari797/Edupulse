import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Full error state with icon, message, and optional retry button */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--danger)]/10 mb-4">
        <AlertCircle
          size={20}
          className="text-[var(--danger)]"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
        >
          <RefreshCw size={13} strokeWidth={1.5} />
          Try again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  className?: string;
}

/** Empty state — shown when an API returns an empty list */
export function EmptyState({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface-hover)] mb-4">
          <Icon size={20} className="text-[var(--text-muted)]" strokeWidth={1.5} />
        </div>
      )}
      {!Icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] mb-4 skeleton" />
      )}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-4">
          {description}
        </p>
      )}
      {actions && <div>{actions}</div>}
    </div>
  );
}
