"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonCard } from "@/components/common/skeleton";
import { ErrorState } from "@/components/common/states";
import { Avatar } from "@/components/common/avatar";
import { RoleBadge } from "@/components/common/role-badge";
import { useStudentProfile } from "@/hooks/student/use-student-profile";
import { User, Save, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StudentProfilePage() {
  const { profile, isLoading, isSaving, error, updateProfile, refetch } = useStudentProfile();

  const [rollNumber, setRollNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setRollNumber(profile.roll_number || "");
      setDateOfBirth(profile.date_of_birth || "");
      setGender(profile.gender || "");
      setGuardianName(profile.guardian_name || "");
      setGuardianPhone(profile.guardian_phone || "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      roll_number: rollNumber,
      date_of_birth: dateOfBirth,
      gender: gender,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <PageHeader title="Profile" subtitle="Loading profile..." />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Profile" subtitle="Student Details & Guardian Info" />
        <ErrorState title="Could not load profile" message={error || undefined} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Student Profile" subtitle="Manage your account details and guardian contacts" />

      {/* ── User Overview Header Box ── */}
      <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center gap-4">
        <Avatar
          firstName={profile.first_name}
          lastName={profile.last_name}
          size="xl"
          accentColor="var(--primary)"
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {profile.first_name} {profile.last_name}
            </h2>
            <RoleBadge roleId={1} />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{profile.email}</p>
          <p className="text-[11px] text-[var(--text-muted)] font-mono mt-1">
            Student ID #{profile.id} • User #{profile.user_id}
          </p>
        </div>
      </div>

      {/* ── Editable Form Box ── */}
      <form onSubmit={handleSubmit} className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <User size={14} className="text-[var(--primary)]" />
          Personal & Guardian Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Roll Number
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. 10A-42"
              className={cn(
                "w-full h-9 px-3 rounded text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={cn(
                "w-full h-9 px-3 rounded text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={cn(
                "w-full h-9 px-3 rounded text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              )}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Guardian Name
            </label>
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="Parent / Guardian Name"
              className={cn(
                "w-full h-9 px-3 rounded text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Guardian Contact Phone
            </label>
            <input
              type="tel"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={cn(
                "w-full h-9 px-3 rounded text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              )}
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            <Save size={13} />
            <span>{isSaving ? "Saving..." : "Save Profile"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
