"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { adminService } from "@/services/admin.service";
import type { CalendarEventDTO } from "@/types/admin.types";
import { Calendar, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminService.getCalendarEvents();
      if (res.success && res.data) setEvents(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading calendar events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setIsSaving(true);
    try {
      const res = await adminService.createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        is_holiday: isHoliday,
      });

      if (res.success && res.data) {
        toast.success(`Event ${res.data.title} created!`);
        setEvents((prev) => [res.data, ...prev]);
        setShowModal(false);
        setTitle("");
        setDescription("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Academic Calendar" subtitle="Loading events..." />
        <SkeletonRow count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Academic Calendar" subtitle="School Calendar Events" />
        <ErrorState title="Could not load calendar events" message={error} onRetry={fetchEvents} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Calendar & Institutional Events"
        subtitle="Manage school holidays, exam windows, sports days, and parent-teacher meeting schedules"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          title="No academic events logged"
          description="Click 'Add Event' above to schedule holidays or exam dates."
          icon={Calendar}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-xs font-semibold text-[var(--text-primary)]">{evt.title}</h4>
                {evt.is_holiday && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--danger)]/10 text-[var(--danger)] font-semibold uppercase">
                    Holiday
                  </span>
                )}
              </div>
              {evt.description && (
                <p className="text-xs text-[var(--text-secondary)]">{evt.description}</p>
              )}
              <div className="text-[11px] text-[var(--text-muted)] font-mono pt-1">
                Event Date: {evt.event_date}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add Academic Event</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Day"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="holidayCheck"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="holidayCheck" className="text-xs text-[var(--text-primary)]">
                    Official Holiday
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
