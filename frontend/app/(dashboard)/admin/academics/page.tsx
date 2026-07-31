"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { adminService } from "@/services/admin.service";
import type { SubjectDTO, AcademicYearDTO, TeacherAssignmentDTO, ClassDTO, AdminUserDTO } from "@/types/admin.types";
import { BookMarked, Calendar, UserCheck, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminAcademicsPage() {
  const [activeTab, setActiveTab] = useState<"Subjects" | "AcademicYears" | "Assignments">("Subjects");
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [years, setYears] = useState<AcademicYearDTO[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignmentDTO[]>([]);
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [teachers, setTeachers] = useState<AdminUserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  
  // Academic Year Form
  const [yearName, setYearName] = useState("");
  const [yearStartDate, setYearStartDate] = useState("2026-06-01");
  const [yearEndDate, setYearEndDate] = useState("2027-04-30");

  // Teacher Assignment Form
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subRes, yrRes, assignRes, classRes, teacherRes] = await Promise.all([
        adminService.getSubjects().catch(() => null),
        adminService.getAcademicYears().catch(() => null),
        adminService.getTeacherAssignments().catch(() => null),
        adminService.getClasses().catch(() => null),
        adminService.getUsers(3).catch(() => null),
      ]);

      if (subRes?.success && subRes.data) setSubjects(subRes.data);
      if (yrRes?.success && yrRes.data) setYears(yrRes.data);
      if (assignRes?.success && assignRes.data) setAssignments(assignRes.data);
      if (classRes?.success && classRes.data) {
        setClasses(classRes.data);
        if (classRes.data.length > 0) setClassId(String(classRes.data[0].id));
      }
      if (teacherRes?.success && teacherRes.data) {
        setTeachers(teacherRes.data);
        if (teacherRes.data.length > 0) setTeacherId(String(teacherRes.data[0].id));
      }
      if (subRes?.data && subRes.data.length > 0) setAssignSubjectId(String(subRes.data[0].id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading academic data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subjectCode.trim()) return;
    setIsSaving(true);
    try {
      const res = await adminService.createSubject({
        name: subjectName.trim(),
        code: subjectCode.trim(),
      });
      if (res.success && res.data) {
        toast.success(`Subject ${res.data.name} created!`);
        setSubjects((prev) => [res.data, ...prev]);
        setShowModal(false);
        setSubjectName("");
        setSubjectCode("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create subject");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) return;
    setIsSaving(true);
    try {
      const res = await adminService.createAcademicYear({
        name: yearName.trim(),
        start_date: yearStartDate,
        end_date: yearEndDate,
      });
      if (res.success && res.data) {
        toast.success(`Academic Year ${res.data.name} created!`);
        setYears((prev) => [res.data, ...prev]);
        setShowModal(false);
        setYearName("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create academic year");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !classId || !assignSubjectId) {
      toast.error("Please select a Teacher, Class, and Subject");
      return;
    }
    setIsSaving(true);
    try {
      const res = await adminService.assignTeacher({
        teacher_id: Number(teacherId),
        class_id: Number(classId),
        subject_id: Number(assignSubjectId),
        is_homeroom: false,
      });
      if (res.success && res.data) {
        toast.success("Teacher assignment saved!");
        setAssignments((prev) => [res.data, ...prev]);
        setShowModal(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Academic Configuration" subtitle="Loading..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Academic Configuration" subtitle="Subjects & Years" />
        <ErrorState title="Could not load academic data" message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Configuration & Assignments"
        subtitle="Manage subject catalog, academic calendars, and teacher-subject-classroom assignments"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>Add {activeTab === "Subjects" ? "Subject" : activeTab === "AcademicYears" ? "Academic Year" : "Assignment"}</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
        {[
          { label: "Subjects Catalog", key: "Subjects" },
          { label: "Academic Years", key: "AcademicYears" },
          { label: "Teacher Assignments", key: "Assignments" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              activeTab === tab.key
                ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Subjects */}
      {activeTab === "Subjects" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {subjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{sub.id}</td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{sub.name}</td>
                  <td className="py-3 px-4 font-mono text-[var(--primary)]">{sub.code}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--success)]/10 text-[var(--success)] font-medium">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Academic Years */}
      {activeTab === "AcademicYears" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {years.map((yr) => (
                <tr key={yr.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{yr.id}</td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{yr.name}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">{yr.start_date || "2026-06-01"}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">{yr.end_date || "2027-04-30"}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--success)]/10 text-[var(--success)] font-medium">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === "Assignments" && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Assignment ID</th>
                <th className="py-3 px-4">Teacher</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Subject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {assignments.map((a) => {
                const teacherObj = teachers.find((t) => t.id === a.teacher_id);
                const classObj = classes.find((c) => c.id === a.class_id);
                const subjectObj = subjects.find((s) => s.id === a.subject_id);

                return (
                  <tr key={a.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{a.id}</td>
                    <td className="py-3 px-4 font-semibold text-[var(--primary)]">
                      {teacherObj ? `${teacherObj.first_name} ${teacherObj.last_name}` : `Teacher #${a.teacher_id}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-primary)]">
                      {classObj ? classObj.name : `Class #${a.class_id}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                      {subjectObj ? subjectObj.name : `Subject #${a.subject_id}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Add {activeTab === "Subjects" ? "Subject" : activeTab === "AcademicYears" ? "Academic Year" : "Teacher Assignment"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            {activeTab === "Subjects" && (
              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="PHY101"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded">Save</button>
                </div>
              </form>
            )}

            {activeTab === "AcademicYears" && (
              <form onSubmit={handleCreateAcademicYear} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Academic Year Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-2027"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={yearStartDate}
                      onChange={(e) => setYearStartDate(e.target.value)}
                      className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={yearEndDate}
                      onChange={(e) => setYearEndDate(e.target.value)}
                      className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded">Save Academic Year</button>
                </div>
              </form>
            )}

            {activeTab === "Assignments" && (
              <form onSubmit={handleAssignTeacher} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Teacher</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Subject</label>
                  <select
                    value={assignSubjectId}
                    onChange={(e) => setAssignSubjectId(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">Cancel</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-medium bg-[var(--primary)] text-white rounded">Save Assignment</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
