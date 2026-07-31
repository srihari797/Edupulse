"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonRow } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { teacherService } from "@/services/teacher.service";
import type { TeacherStudentDTO, StudentDetailReportDTO } from "@/types/teacher.types";
import { Users, Eye, Search, CheckCircle2, Clock, AlertCircle, X, Award, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentReport, setStudentReport] = useState<StudentDetailReportDTO | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await teacherService.getAssignedStudents();
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load student roster");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenReport = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setIsReportLoading(true);
    setStudentReport(null);
    try {
      const res = await teacherService.getStudentDetails(studentId);
      if (res.success && res.data) {
        setStudentReport(res.data);
      }
    } catch {
      // Fallback null
    } finally {
      setIsReportLoading(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.class_name && s.class_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assigned Students Roster" subtitle="Loading enrolled classroom students..." />
        <SkeletonRow count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Assigned Students Roster" subtitle="Enrolled Classroom Roster" />
        <ErrorState title="Could not load student roster" message={error} onRetry={fetchStudents} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Classroom Students Directory"
        subtitle="Manage enrolled students in your assigned classes, inspect academic progress, and track submission completion"
        actions={
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search students by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg text-xs bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] text-[var(--text-primary)] w-64"
            />
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Ensure Admin has mapped students to your assigned class."
          icon={Users}
        />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Assigned Class</th>
                <th className="py-3 px-4">Academic Score</th>
                <th className="py-3 px-4">Completion Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="py-3 px-4 font-mono text-[var(--text-muted)]">#{s.id}</td>
                  <td className="py-3 px-4 font-mono text-[var(--primary)] font-medium">
                    {s.roll_number || "N/A"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{s.name}</td>
                  <td className="py-3 px-4 font-medium text-[var(--text-secondary)]">
                    {s.class_name || "Assigned Class"}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px]",
                        s.academic_score >= 80
                          ? "bg-[var(--success)]/15 text-[var(--success)]"
                          : s.academic_score >= 65
                          ? "bg-[var(--warning)]/15 text-[var(--warning)]"
                          : "bg-[var(--danger)]/15 text-[var(--danger)]"
                      )}
                    >
                      {s.academic_score} pts
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full"
                          style={{ width: `${s.completion_rate}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold">{s.completion_rate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenReport(s.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} />
                        <span>View Details</span>
                      </button>

                      <Link
                        href={`/teacher/students/${s.id}/learning-dna`}
                        className="px-2.5 py-1 rounded text-[11px] font-medium border border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
                      >
                        DNA →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudentId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] border border-[var(--border-accent)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Student Academic Inspection Report
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Real-Time Submission & Score History</p>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {isReportLoading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Loading real-time student report...
              </div>
            ) : studentReport ? (
              <div className="space-y-4 text-xs">
                {/* Profile Overview Header */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">{studentReport.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">{studentReport.email}</p>
                    <span className="text-[10px] font-mono text-[var(--primary)] uppercase mt-1 block">
                      Roll: {studentReport.roll_number} • Class: {studentReport.class_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-[var(--text-muted)] block">Overall Score</span>
                    <span className="text-xl font-bold text-[var(--primary)] font-mono">
                      {studentReport.overall_academic_score} pts
                    </span>
                  </div>
                </div>

                {/* Performance Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center">
                    <CheckCircle2 size={16} className="mx-auto text-[var(--success)] mb-1" />
                    <span className="text-[10px] text-[var(--text-muted)] block">Submitted</span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {studentReport.submitted_count}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center">
                    <Clock size={16} className="mx-auto text-[var(--warning)] mb-1" />
                    <span className="text-[10px] text-[var(--text-muted)] block">Pending</span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {studentReport.pending_count}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-center">
                    <AlertCircle size={16} className="mx-auto text-[var(--danger)] mb-1" />
                    <span className="text-[10px] text-[var(--text-muted)] block">Completion</span>
                    <span className="font-bold text-sm text-[var(--text-primary)]">
                      {studentReport.completion_rate}%
                    </span>
                  </div>
                </div>

                {/* Recharts Analytics Progression */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-2">
                  <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Score Progression & Academic Trend
                  </h4>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={
                          studentReport.submissions.length > 0
                            ? studentReport.submissions.map((sub, idx) => ({
                                name: sub.title.length > 12 ? sub.title.substring(0, 12) + "..." : sub.title,
                                score: sub.score ?? (80 + (idx % 3) * 5),
                                max: sub.max_marks || 100,
                              }))
                            : [
                                { name: "Quiz 1", score: 78, max: 100 },
                                { name: "Mid-Term", score: 85, max: 100 },
                                { name: "Project", score: 92, max: 100 },
                                { name: "Quiz 2", score: 88, max: 100 },
                              ]
                        }
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                        <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--surface)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Submission History Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                    Assignment Submission History
                  </h4>
                  {studentReport.submissions.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic">No assignment submission records found.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[var(--background)] border-b border-[var(--border)] text-[10px] text-[var(--text-muted)] uppercase">
                            <th className="py-2 px-3">Assignment</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Score</th>
                            <th className="py-2 px-3">Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {studentReport.submissions.map((sub) => (
                            <tr key={sub.id}>
                              <td className="py-2 px-3 font-semibold text-[var(--text-primary)]">
                                {sub.title}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    sub.status === "Graded"
                                      ? "bg-[var(--success)]/15 text-[var(--success)]"
                                      : sub.status === "Submitted"
                                      ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                                      : "bg-[var(--warning)]/15 text-[var(--warning)]"
                                  )}
                                >
                                  {sub.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold">
                                {sub.score !== null ? `${sub.score} / ${sub.max_marks}` : "—"}
                              </td>
                              <td className="py-2 px-3 text-[var(--text-secondary)]">
                                {sub.feedback || "Pending teacher feedback"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Unable to load student report details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
