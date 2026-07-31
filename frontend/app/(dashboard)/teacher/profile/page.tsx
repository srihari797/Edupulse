"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { teacherService } from "@/services/teacher.service";
import { User, Mail, Building2, FileText, Check, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeacherProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await teacherService.getProfile();
      if (res.success && res.data) {
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
        setEmail(res.data.email || "");
        setDepartment(res.data.department || "");
        setBio(res.data.bio || "");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await teacherService.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        department: department.trim(),
        bio: bio.trim(),
      });
      if (res.success) {
        toast.success("Profile updated successfully in PostgreSQL database!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Error saving profile update");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Teacher Profile Settings" subtitle="Loading profile configuration..." />
        <div className="p-8 text-center text-xs text-[var(--text-muted)] font-mono">
          Fetching profile details from database...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Teacher Profile Settings"
        subtitle="Manage your personal details, academic department, and professional bio visible across EduPulse"
      />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-[var(--border)] pb-5">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/15 border-2 border-[var(--primary)] flex items-center justify-center text-[var(--primary)] font-bold text-xl">
            {firstName ? firstName[0]?.toUpperCase() : "T"}
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {firstName} {lastName}
            </h3>
            <span className="text-xs text-[var(--text-muted)] font-mono">{email}</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--primary)]/15 text-[var(--primary)]">
                Faculty Instructor
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--success)]">
                <ShieldCheck size={12} /> Active Account
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
              Academic Department *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Science & Physics Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase mb-1">
              Professional Bio & Specialization *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Enter your professional bio, office hours, and research background..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 font-medium text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save size={14} />
              <span>{isSaving ? "Saving Changes..." : "Save Profile Details"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
