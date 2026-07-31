"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { notificationService } from "@/services/notification.service";
import type { NotificationDTO } from "@/types/notification.types";
import { Bell, CheckCircle2, Sparkles, BookOpen, Calendar, Target, Award, Filter, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications(1, 50);
      if (res.success && res.data) {
        setNotifications(res.data.items || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        toast.success("Notification marked as read");
      }
    } catch {
      toast.error("Failed to update notification");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Assignment":
        return <BookOpen size={16} className="text-[var(--primary)]" />;
      case "AI Insight":
        return <Sparkles size={16} className="text-[var(--warning)]" />;
      case "Shared Goal":
        return <Target size={16} className="text-[var(--success)]" />;
      case "Achievement":
        return <Award size={16} className="text-[var(--warning)]" />;
      case "Reminder":
        return <Calendar size={16} className="text-[var(--primary)]" />;
      default:
        return <Bell size={16} className="text-[var(--text-secondary)]" />;
    }
  };

  const filtered = notifications.filter((n) => (activeFilter === "unread" ? !n.is_read : true));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="In-App Notifications" subtitle="Loading notifications..." />
        <SkeletonRow count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <PageHeader title="In-App Notifications" subtitle="Notifications Center" />
        <ErrorState title="Could not load notifications" message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="In-App Notifications & Alerts Center"
        subtitle="Stay informed about assignment updates, AI insights, shared goal milestones, and system reminders"
        actions={
          <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                activeFilter === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                activeFilter === "unread"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={activeFilter === "unread" ? "No unread notifications" : "No notifications logged"}
          description="System activity alerts and AI insights will appear here automatically."
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={cn(
                "p-4 rounded-xl border transition-all flex items-start gap-4 shadow-sm",
                n.is_read
                  ? "bg-[var(--surface)] border-[var(--border)] opacity-80"
                  : "bg-[var(--surface-hover)] border-[var(--border-accent)]"
              )}
            >
              <div className="p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)] shrink-0">
                {getIcon(n.notification_type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    {n.title}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block" />
                    )}
                  </h4>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : "Today"}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{n.content}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold font-mono text-[var(--primary)]">
                    {n.notification_type}
                  </span>

                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline font-medium"
                    >
                      <Check size={12} />
                      <span>Mark as read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
