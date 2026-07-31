"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { teacherService } from "@/services/teacher.service";

export function ProfileWarningBanner() {
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await teacherService.getProfile();
        if (res.success && res.data) {
          const { bio, department } = res.data;
          if (!bio || !department || bio === "Senior Instructor" || department === "General") {
            setIsIncomplete(true);
          }
        }
      } catch {
        // Silently handle
      }
    };
    checkProfile();
  }, []);

  if (!isIncomplete || dismissed) return null;

  return (
    <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--warning)]/20 text-[var(--warning)] shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div>
          <span className="font-bold text-[var(--text-primary)] block text-sm">
            Action Required: Complete Your Teacher Profile
          </span>
          <span className="text-[var(--text-secondary)]">
            Your department specialization and bio are not configured. Setting your profile enables parent-teacher collaboration and student assignment mapping.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/teacher/profile"
          className="px-3.5 py-1.5 rounded-lg bg-[var(--warning)] text-black font-semibold text-xs hover:bg-[var(--warning)]/90 transition-colors flex items-center gap-1 shadow-sm"
        >
          <span>Complete Profile</span>
          <ArrowRight size={14} />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
