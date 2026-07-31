"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { adminService } from "@/services/admin.service";
import type { AdminUserDTO, ClassDTO } from "@/types/admin.types";
import { GraduationCap, Users, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminStudentManagementPage() {
  const [students, setStudents] = useState<AdminUserDTO[]>([]);
  const [parents, setParents] = useState<AdminUserDTO[]>([]);
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Student-Class Map Form
  const [mapStudentId, setMapStudentId] = useState("");
  const [mapClassId, setMapClassId] = useState("");
  const [isMapping, setIsMapping] = useState(false);

  // Parent-Student Link Form
  const [linkStudentId, setLinkStudentId] = useState("");
  const [linkParentId, setLinkParentId] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Student Promotion Form
  const [promoStudentIds, setPromoStudentIds] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [isPromoting, setIsPromoting] = useState(false);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const [stuRes, parRes, clsRes] = await Promise.all([
        adminService.getUsers(1).catch(() => null),
        adminService.getUsers(2).catch(() => null),
        adminService.getClasses().catch(() => null),
      ]);

      if (stuRes?.success && stuRes.data) {
        setStudents(stuRes.data);
        if (stuRes.data.length > 0) {
          setMapStudentId(String(stuRes.data[0].id));
          setLinkStudentId(String(stuRes.data[0].id));
          setPromoStudentIds(stuRes.data.map((s) => s.id).join(", "));
        }
      }

      if (parRes?.success && parRes.data) {
        setParents(parRes.data);
        if (parRes.data.length > 0) {
          setLinkParentId(String(parRes.data[0].id));
        }
      }

      if (clsRes?.success && clsRes.data) {
        setClasses(clsRes.data);
        if (clsRes.data.length > 0) {
          setMapClassId(String(clsRes.data[0].id));
          setTargetClassId(String(clsRes.data[0].id));
        }
      }
    } catch {
      toast.error("Failed to load user and class records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleMapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapStudentId || !mapClassId) {
      toast.error("Please select a Student and Target Class");
      return;
    }
    setIsMapping(true);
    try {
      const res = await adminService.mapStudentToClass({
        student_id: Number(mapStudentId),
        class_id: Number(mapClassId),
      });
      if (res.success) {
        const studentObj = students.find((s) => s.id === Number(mapStudentId));
        const classObj = classes.find((c) => c.id === Number(mapClassId));
        const studentName = studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : `#${mapStudentId}`;
        const className = classObj ? classObj.name : `#${mapClassId}`;
        toast.success(`Student ${studentName} mapped to Class ${className}!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Mapping failed");
    } finally {
      setIsMapping(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudentId || !linkParentId) {
      toast.error("Please select a Student and Parent");
      return;
    }
    setIsLinking(true);
    try {
      const res = await adminService.linkParentToStudent({
        student_id: Number(linkStudentId),
        parent_id: Number(linkParentId),
      });
      if (res.success) {
        const studentObj = students.find((s) => s.id === Number(linkStudentId));
        const parentObj = parents.find((p) => p.id === Number(linkParentId));
        const studentName = studentObj ? `${studentObj.first_name} ${studentObj.last_name}` : `#${linkStudentId}`;
        const parentName = parentObj ? `${parentObj.first_name} ${parentObj.last_name}` : `#${linkParentId}`;
        toast.success(`Parent ${parentName} linked to Student ${studentName}!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Linking failed");
    } finally {
      setIsLinking(false);
    }
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoStudentIds || !targetClassId) return;
    setIsPromoting(true);
    try {
      const ids = promoStudentIds
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean);

      const res = await adminService.promoteStudents({
        student_ids: ids,
        target_class_id: Number(targetClassId),
      });
      if (res.success && res.data) {
        const classObj = classes.find((c) => c.id === Number(targetClassId));
        const className = classObj ? classObj.name : `#${res.data.target_class_id}`;
        toast.success(`${res.data.promoted_count} students promoted to Class ${className}!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Promotion failed");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Student Management Operations"
        subtitle="Map students to grade classrooms, link parent guardian accounts, and batch promote students"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Map Student to Class */}
        <form onSubmit={handleMapSubmit} className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <GraduationCap size={16} className="text-[var(--primary)]" />
            Map Student to Classroom
          </h3>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Select Student</label>
            {students.length === 0 ? (
              <input
                type="number"
                required
                placeholder="Student ID"
                value={mapStudentId}
                onChange={(e) => setMapStudentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            ) : (
              <select
                value={mapStudentId}
                onChange={(e) => setMapStudentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name || "Student"} {s.last_name || `#${s.id}`} ({s.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Select Target Class</label>
            {classes.length === 0 ? (
              <input
                type="number"
                required
                placeholder="Class ID"
                value={mapClassId}
                onChange={(e) => setMapClassId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            ) : (
              <select
                value={mapClassId}
                onChange={(e) => setMapClassId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={isMapping || isLoading}
            className="w-full py-1.5 rounded text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {isMapping ? "Mapping..." : "Map Student to Class"}
          </button>
        </form>

        {/* Form 2: Link Parent to Student */}
        <form onSubmit={handleLinkSubmit} className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-2">
            <Users size={16} className="text-[var(--success)]" />
            Link Parent Guardian Account
          </h3>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Select Student</label>
            {students.length === 0 ? (
              <input
                type="number"
                required
                placeholder="Student ID"
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            ) : (
              <select
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name || "Student"} {s.last_name || `#${s.id}`} ({s.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">Select Parent Account</label>
            {parents.length === 0 ? (
              <input
                type="number"
                required
                placeholder="Parent User ID"
                value={linkParentId}
                onChange={(e) => setLinkParentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            ) : (
              <select
                value={linkParentId}
                onChange={(e) => setLinkParentId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name || "Parent"} {p.last_name || `#${p.id}`} ({p.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={isLinking || isLoading}
            className="w-full py-1.5 rounded text-xs font-medium bg-[var(--success)] text-white hover:bg-[var(--success)]/90 disabled:opacity-50 transition-colors"
          >
            {isLinking ? "Linking..." : "Link Parent Account"}
          </button>
        </form>
      </div>

      {/* Form 3: Batch Student Promotion */}
      <form onSubmit={handlePromotionSubmit} className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-2">
          <ArrowUpRight size={16} className="text-[var(--warning)]" />
          Batch Student Academic Year Promotion
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Comma-Separated Student IDs
            </label>
            <input
              type="text"
              required
              placeholder="1, 2, 3, 4"
              value={promoStudentIds}
              onChange={(e) => setPromoStudentIds(e.target.value)}
              className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1">
              Promote to Class
            </label>
            {classes.length === 0 ? (
              <input
                type="number"
                required
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              />
            ) : (
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full h-8 px-3 rounded text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPromoting || isLoading}
            className="px-4 py-1.5 rounded text-xs font-medium bg-[var(--warning)] text-white hover:bg-[var(--warning)]/90 disabled:opacity-50 transition-colors"
          >
            {isPromoting ? "Promoting..." : "Promote Batch Students"}
          </button>
        </div>
      </form>

      {/* Overview Table of Registered Students */}
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-2">
          <CheckCircle2 size={16} className="text-[var(--primary)]" />
          Registered Students Directory
        </h3>

        {students.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No student records found. Create student accounts in User Management first.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50 text-[11px] font-semibold text-[var(--text-muted)] uppercase">
                  <th className="py-2.5 px-4">User ID</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5 px-4 font-mono text-[var(--text-muted)]">#{s.id}</td>
                    <td className="py-2.5 px-4 font-semibold text-[var(--text-primary)]">
                      {s.first_name || "Student"} {s.last_name || `#${s.id}`}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--text-secondary)]">{s.email}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--success)]/10 text-[var(--success)] font-medium">
                        Active Account
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
