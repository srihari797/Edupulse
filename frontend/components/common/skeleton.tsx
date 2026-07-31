import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Single shimmer skeleton block */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

/** Grid of skeleton cards matching dashboard KPI card shapes */
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}

/** Skeleton matching a list/table row */
export function SkeletonRow({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-md" />
      ))}
    </div>
  );
}

/** Skeleton matching an AI insight card */
export function SkeletonCard() {
  return (
    <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-3">
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
    </div>
  );
}

/** Skeleton matching the growth radar chart */
export function SkeletonRadar() {
  return (
    <div className="flex items-center justify-center">
      <Skeleton className="w-64 h-64 rounded-full" />
    </div>
  );
}

/** Skeleton matching a chat message bubble */
export function SkeletonMessage({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={cn("flex gap-2", align === "right" && "flex-row-reverse")}>
      <Skeleton className="w-7 h-7 rounded-full shrink-0" />
      <div className="space-y-1 flex-1 max-w-xs">
        <Skeleton className="h-4 rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
      </div>
    </div>
  );
}
