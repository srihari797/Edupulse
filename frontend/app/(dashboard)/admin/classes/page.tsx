"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { adminService } from "@/services/admin.service";
import type { ClassDTO, SectionDTO } from "@/types/admin.types";
import { Building2, Plus, Trash2, X, Users, Eye } from "lucide-react";
import { toast } from "sonner";

interface ClassStudentDTO {
  id: number;
  roll_number?: string;
  name: string;
  email: string;
  is_active: boolean;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [sections, setSections] = useState<SectionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showClassModal, setShowClassModal] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Students Modal State
  const [selectedClass, setSelectedClass] = useState<ClassDTO | null>(null);
  const [classStudents, setClassStudents] = useState<ClassStudentDTO[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  // Timetable Modal State
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classRes, secRes] = await Promise.all([
        adminService.getClasses(),
        adminService.getSections().catch(() => null),
      ]);

      if (classRes.success && classRes.data) setClasses(classRes.data);
      if (secRes?.success && secRes.data) setSections(secRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching classes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewStudents = async (item: ClassDTO) => {
    setSelectedClass(item);
    setShowStudentsModal(true);
    setIsLoadingStudents(true);
    try {
      const res = await adminService.getClassStudents(item.id);
      if (res.success && res.data) {
        setClassStudents(res.data);
      } else {
        setClassStudents([]);
      }
    } catch {
      setClassStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleViewTimetable = async (item: ClassDTO) => {
    setSelectedClass(item);
    setShowTimetableModal(true);
    setIsLoadingTimetable(true);
    try {
      const res = await adminService.getTimetable(item.id);
      if (res.success && res.data) {
        setTimetableSlots(res.data);
      } else {
        setTimetableSlots([]);
      }
    } catch {
      setTimetableSlots([]);
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const res = await adminService.createClass({
        name: name.trim(),
        grade: grade.trim() || undefined,
        section: section.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Class ${res.data.name} created!`);
        setClasses((prev) => [res.data, ...prev]);
        setShowClassModal(false);
        setName("");
        setGrade("");
        setSection("");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    try {
      const res = await adminService.deleteClass(id);
      if (res.success) {
        toast.success("Class deleted");
        setClasses((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete class");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Classes & Sections" subtitle="Loading classroom lists..." />
        <SkeletonRow count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Classes & Sections" subtitle="Classroom Management" />
        <ErrorState title="Could not load classes" message={error} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class & Section Management"
        subtitle="Configure school grade levels, sections, and classroom capacities"
        actions={
          <button
            onClick={() => setShowClassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus size={14} />
            <span>Create Class</span>
          </button>
        }
      />

      {/* Class List Table */}
      {classes.length === 0 ? (
        <EmptyState
          title="No classes created yet"
          description="Click 'Create Class' above to set up grade classrooms."
          icon={Building2}
        />
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Class ID</th>
                  <th className="py-3 px-4">Classroom Name</th>
                  <th className="py-3 px-4">Grade</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {classes.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleViewStudents(item)}
                    className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                      #{item.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                      {item.grade || "Grade 10"}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] font-mono">
                      {item.section || "A"}
                    </td>
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStudents(item);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                        title="View assigned students"
                      >
                        <Users size={14} />
                        <span>Students</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTimetable(item);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        title="View weekly timetable"
                      >
                        <Eye size={14} />
                        <span>Timetable</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClass(item.id);
                        }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        title="Delete class"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Assigned Students Modal */}
      {showStudentsModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Class: {selectedClass.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Students Assigned</p>
              </div>
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedClass(null);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              {isLoadingStudents ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Loading students...
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] font-medium">
                  No students are assigned to this class.
                </div>
              ) : (
                <div className="space-y-3">
                  {classStudents.map((stu, index) => (
                    <div
                      key={stu.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]/50 text-xs hover:border-[var(--primary)]/30 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">
                            {index + 1}. {stu.name}
                          </span>
                          {stu.roll_number && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                              {stu.roll_number}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {stu.email}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          stu.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {stu.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedClass(null);
                }}
                className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Timetable Modal */}
      {showTimetableModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Class Timetable: {selectedClass.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Published Schedule Grid</p>
              </div>
              <button
                onClick={() => {
                  setShowTimetableModal(false);
                  setSelectedClass(null);
                  setTimetableSlots([]);
                }}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-1">
              {isLoadingTimetable ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Loading timetable slots...
                </div>
              ) : timetableSlots.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)] font-medium">
                  No published timetable slots exist for this class.
                </div>
              ) : (
                <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
                  <table className="w-full text-center border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3 border border-[var(--border)] text-left w-24 bg-[var(--surface-hover)]">Period</th>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                          <th key={day} className="py-2.5 px-3 border border-[var(--border)]">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(period => {
                        // Check if any slot exists in this period on any day to determine if we should render this row
                        const rowHasSlots = timetableSlots.some(s => s.period_number === period);
                        if (!rowHasSlots) return null;
                        
                        return (
                          <tr key={period} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)]/40 transition-colors">
                            <td className="py-3 px-3 font-semibold text-[var(--text-muted)] border border-[var(--border)] bg-[var(--background)]/20 text-left">
                              Period {period}
                            </td>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => {
                              const cell = timetableSlots.find(s => s.day_of_week === day && s.period_number === period);
                              return (
                                <td key={day} className="py-3 px-3 border border-[var(--border)] bg-[var(--surface)] text-center min-w-[100px]">
                                  {cell ? (
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-[var(--text-primary)] text-[11px]">{cell.subject_name}</div>
                                      <div className="text-[10px] text-[var(--text-secondary)]">{cell.teacher_name}</div>
                                      <div className="text-[9px] text-[var(--text-muted)] font-mono">{cell.start_time} - {cell.end_time}</div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-[var(--text-muted)]/40 italic">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setShowTimetableModal(false);
                  setSelectedClass(null);
                  setTimetableSlots([]);
                }}
                className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Create New Class
              </h3>
              <button
                onClick={() => setShowClassModal(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Classroom Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10-A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    placeholder="Grade 10"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-3 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

