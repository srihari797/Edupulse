"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { adminService } from "@/services/admin.service";
import type { ClassDTO, TeacherAvailabilityDTO, TimetableSlotDTO } from "@/types/admin.types";
import {
  CalendarCheck, ChevronRight, ChevronLeft, Users, BookOpen,
  CheckCircle, AlertCircle, Loader2, Eye, RefreshCw, Send, Edit3
} from "lucide-react";
import { toast } from "sonner";

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS_5 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAYS_6 = [...DAYS_5, "Saturday"];
const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "09:00", end: "09:45" },
  2: { start: "09:45", end: "10:30" },
  3: { start: "10:45", end: "11:30" },
  4: { start: "11:30", end: "12:15" },
  5: { start: "13:00", end: "13:45" },
  6: { start: "13:45", end: "14:30" },
  7: { start: "14:30", end: "15:15" },
  8: { start: "15:15", end: "16:00" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface GridCell {
  day: string;
  period: number;
  subject_id: number | null;
  subject_name: string;
  teacher_id: number | null;
  teacher_name: string;
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ["Select Class", "Configure Grid", "Select Teachers", "Assign & Publish"];
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const s = i + 1;
        const isActive = s === step;
        const isDone = s < step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isDone ? "bg-emerald-500/20 text-emerald-400" :
              isActive ? "bg-[var(--primary)]/20 text-[var(--primary)] ring-1 ring-[var(--primary)]" :
              "bg-[var(--border)]/50 text-[var(--text-muted)]"
            }`}>
              {isDone ? <CheckCircle size={12} /> : <span className="w-4 h-4 flex items-center justify-center rounded-full bg-current/20">{s}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${s < step ? "bg-emerald-500/50" : "bg-[var(--border)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminTimetablePage() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (selectedGrade && selectedSection) {
      const matched = classes.find(
        c => String(c.grade) === String(selectedGrade) && String(c.section) === String(selectedSection)
      );
      if (matched) {
        setSelectedClassId(matched.id);
      }
    }
  }, [selectedGrade, selectedSection, classes]);

  const uniqueGrades = Array.from(new Set(classes.map(c => c.grade).filter(Boolean))).sort() as string[];
  const uniqueSections = Array.from(new Set(classes.map(c => c.section).filter(Boolean))).sort() as string[];

  // Step 2 state
  const [workingDays, setWorkingDays] = useState<5 | 6>(5);
  const [periodsPerDay, setPeriodsPerDay] = useState(6);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);

  // Step 3 state
  const [teachers, setTeachers] = useState<TeacherAvailabilityDTO[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Step 4 state
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Published view state
  const [publishedSlots, setPublishedSlots] = useState<TimetableSlotDTO[] | null>(null);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<any[]>([]);

  // Helper: check if teacher is qualified for PE
  const isPeTeacher = (t: TeacherAvailabilityDTO) => {
    const subj = (t.subject_name || "").toLowerCase();
    const name = (t.name || "").toLowerCase();
    return (
      subj.includes("pe") ||
      subj.includes("physical education") ||
      subj.includes("sports") ||
      subj.includes("gym") ||
      name.includes("pe") ||
      name.includes("physical education") ||
      name.includes("sports")
    );
  };

  // Helper: check if teacher teaches a specific subject name
  const isTeacherForSubject = (t: TeacherAvailabilityDTO, sName: string) => {
    const tSub = (t.subject_name || "").toLowerCase();
    const sNameLower = sName.toLowerCase();
    if (sNameLower === "physical education" || sNameLower === "pe") {
      return isPeTeacher(t);
    }
    return tSub === sNameLower || tSub.includes(sNameLower) || sNameLower.includes(tSub);
  };

  // Helper: Subject Weightage distribution and canonical cleanup
  const getSubjectAllocations = (
    totalSlots: number,
    allSubjects: Array<{ id: number; name: string }>
  ) => {
    // Preserve single canonical subject per case-insensitive name
    const canonical = allSubjects.filter((sub, index, self) =>
      index === self.findIndex(s => s.name.toLowerCase() === sub.name.toLowerCase())
    );

    // Configurable weightage defaults
    const defaultWeights: Record<string, number> = {
      "mathematics": 7,
      "science": 6,
      "english": 5,
      "social science": 5,
      "tamil": 5,
      "physical education": 2
    };

    const peSubject = canonical.find(
      s => s.name.toLowerCase() === "physical education" || s.name.toLowerCase() === "pe"
    );

    // PE gets exactly 2 periods. Remaining slots distributed proportionally.
    const remainingSlots = totalSlots - 2;
    const otherSubjects = canonical.filter(s => s.id !== peSubject?.id);

    let otherWeightSum = 0;
    otherSubjects.forEach(s => {
      const nameLower = s.name.toLowerCase();
      otherWeightSum += defaultWeights[nameLower] ?? 4;
    });

    const allocations: Record<number, number> = {};
    if (peSubject) {
      allocations[peSubject.id] = 2;
    }

    let allocatedSum = 0;
    otherSubjects.forEach((s, idx) => {
      const nameLower = s.name.toLowerCase();
      const w = defaultWeights[nameLower] ?? 4;
      let alloc = 0;
      if (idx === otherSubjects.length - 1) {
        alloc = remainingSlots - allocatedSum;
      } else {
        alloc = Math.round(w * (remainingSlots / otherWeightSum));
        allocatedSum += alloc;
      }
      allocations[s.id] = alloc;
    });

    return { allocations, canonicalSubjects: canonical };
  };

  // ── Load classes & subjects ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingClasses(true);
      try {
        const [classRes, subjectRes] = await Promise.all([
          adminService.getClasses(),
          adminService.getSubjects(),
        ]);
        if (classRes.success && classRes.data) setClasses(classRes.data);
        if (subjectRes.success && subjectRes.data) {
          let list = subjectRes.data;
          const hasPE = list.some(s => s.name.toLowerCase() === "physical education" || s.code.toLowerCase() === "pe");
          if (!hasPE) {
            try {
              const peRes = await adminService.createSubject({ name: "Physical Education", code: "PE" });
              if (peRes.success && peRes.data) {
                list = [...list, peRes.data];
              }
            } catch (e) {
              console.error("Failed to auto-create PE subject in DB", e);
            }
          }
          setSubjects(list);
        }
      } catch {
        toast.error("Failed to load class data");
      } finally {
        setLoadingClasses(false);
      }
    };
    load();
  }, []);

  // ── Step navigation ──────────────────────────────────────────────────────────

  const goStep2 = () => {
    if (!selectedClassId) { toast.error("Please select a class first"); return; }
    setStep(2);
  };

  const goStep3 = async () => {
    setLoadingTeachers(true);
    setStep(3);
    try {
      const res = await adminService.getTimetableTeachers();
      if (res.success && res.data) {
        setTeachers(res.data);
      }
    } catch {
      toast.error("Failed to load teachers");
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ── Automatic Timetable Generator ───────────────────────────────────────────

  const generateAutomaticTimetable = async () => {
    setValidationErrors([]);
    setAiInsights(null);

    if (selectedClassId) {
      try {
        const aiRes = await adminService.generateAITimetable(selectedClassId, selectedTeacherIds);
        if (aiRes.success && aiRes.data) {
          const { slots, ai_optimization_summary } = aiRes.data;
          setAiInsights(ai_optimization_summary);
          
          if (slots && slots.length > 0) {
            const mappedGrid: GridCell[] = slots.map(s => ({
              day: s.day_of_week,
              period: s.period_number,
              subject_id: s.subject_id,
              subject_name: s.subject_name || "",
              teacher_id: s.teacher_id,
              teacher_name: s.teacher_name || ""
            }));

            // Sync selectedTeacherIds state with assigned grid teachers to pass client-side verification
            const assignedTeacherIds = Array.from(new Set(mappedGrid.map(g => g.teacher_id).filter(Boolean))) as number[];
            setSelectedTeacherIds(prev => Array.from(new Set([...prev, ...assignedTeacherIds])));

            setGrid(mappedGrid);
            toast.success("🤖 Groq AI Engine generated a conflict-free weekly timetable!");
            return true;
          }
        }
      } catch (e) {
        console.error("AI Timetable backend generation fallback to local search", e);
      }
    }

    const busyTeachers = new Set<string>();
    const days = workingDays === 5 ? DAYS_5 : DAYS_6;
    const totalSlots = days.length * periodsPerDay;

    // 2. Validate PE teacher availability
    const selectedTeachers = teachers.filter(t => selectedTeacherIds.includes(t.id));
    const peTeachers = selectedTeachers.filter(isPeTeacher);
    if (peTeachers.length === 0) {
      const errMsg = "No Physical Education teacher is selected. Timetable generation cannot be completed. Please select a teacher who teaches PE.";
      setValidationErrors([errMsg]);
      toast.error(errMsg);
      return false;
    }

    // 3. Get subject allocations based on weightages
    const { allocations, canonicalSubjects } = getSubjectAllocations(totalSlots, subjects);

    // Filter subjects that have at least one selected teacher
    const activeSubjects = canonicalSubjects.filter(sub => {
      return selectedTeachers.some(t => isTeacherForSubject(t, sub.name));
    });

    // Check if we can cover all slots
    const requiredPeriodsList: Array<{ subjectId: number; subjectName: string; required: number }> = [];
    let allocatedTotal = 0;
    
    activeSubjects.forEach(sub => {
      const req = allocations[sub.id] || 0;
      if (req > 0) {
        requiredPeriodsList.push({ subjectId: sub.id, subjectName: sub.name, required: req });
        allocatedTotal += req;
      }
    });

    if (allocatedTotal < totalSlots && requiredPeriodsList.length > 0) {
      requiredPeriodsList[0].required += (totalSlots - allocatedTotal);
    }

    // Backtracking Search function
    const slotsToFill: Array<{ day: string; period: number }> = [];
    for (const day of days) {
      for (let p = 1; p <= periodsPerDay; p++) {
        slotsToFill.push({ day, period: p });
      }
    }

    const currentGrid: GridCell[] = slotsToFill.map(s => ({
      day: s.day,
      period: s.period,
      subject_id: null,
      subject_name: "",
      teacher_id: null,
      teacher_name: ""
    }));

    const allocatedCounts = new Map<number, number>();
    requiredPeriodsList.forEach(item => allocatedCounts.set(item.subjectId, 0));

    const runSearch = (strictDistribution: boolean): boolean => {
      let iterations = 0;
      const MAX_ITERATIONS = 10000;
      // Clear grid assignments
      currentGrid.forEach(c => {
        c.subject_id = null;
        c.subject_name = "";
        c.teacher_id = null;
        c.teacher_name = "";
      });
      requiredPeriodsList.forEach(item => allocatedCounts.set(item.subjectId, 0));

      const backtrack = (slotIdx: number): boolean => {
        iterations++;
        if (iterations > MAX_ITERATIONS) return false;
        if (slotIdx === slotsToFill.length) {
          return true;
        }

        const slot = slotsToFill[slotIdx];
        
        for (const item of requiredPeriodsList) {
          const currentCount = allocatedCounts.get(item.subjectId) || 0;
          if (currentCount >= item.required) continue;

          // Distribution constraint: avoid clustering all sessions of a subject into one day
          if (strictDistribution) {
            const dailyCount = currentGrid.filter(c => c.day === slot.day && c.subject_id === item.subjectId).length;
            const maxPerDay = Math.ceil(item.required / days.length);
            if (dailyCount >= maxPerDay) continue;
          }

          // Find available teachers for this subject from selected list
          const subjectTeachers = selectedTeachers.filter(t => isTeacherForSubject(t, item.subjectName));
          
          for (const teacher of subjectTeachers) {
            // Teacher conflict check (already teaching another class)
            if (busyTeachers.has(`${teacher.id}|${slot.day}|${slot.period}`)) {
              continue;
            }

            // Assign
            const cell = currentGrid[slotIdx];
            cell.subject_id = item.subjectId;
            cell.subject_name = item.subjectName;
            cell.teacher_id = teacher.id;
            cell.teacher_name = teacher.name;
            allocatedCounts.set(item.subjectId, currentCount + 1);

            if (backtrack(slotIdx + 1)) {
              return true;
            }

            // Backtrack
            cell.subject_id = null;
            cell.subject_name = "";
            cell.teacher_id = null;
            cell.teacher_name = "";
            allocatedCounts.set(item.subjectId, currentCount);
          }
        }
        return false;
      };

      return backtrack(0);
    };

    // Try strictly first
    let success = runSearch(true);
    if (!success) {
      // Fallback: relax daily subject limit constraints
      success = runSearch(false);
    }

    if (success) {
      setGrid([...currentGrid]);
      setValidationErrors([]);
      return true;
    } else {
      const errMsg = "Could not find a conflict-free timetable configuration with the selected teachers. Try selecting more teachers.";
      setValidationErrors([errMsg]);
      return false;
    }
  };

  const goStep4 = async () => {
    if (selectedTeacherIds.length === 0) {
      toast.error("Please select at least one teacher.");
      return;
    }
    setStep(4);
    const success = await generateAutomaticTimetable();
    if (success) {
      toast.success("✨ Timetable automatically generated!");
    } else {
      toast.error("Timetable generation failed due to conflicts.");
    }
  };

  // ── Optional AI Analysis (Groq) ─────────────────────────────────────────────

  const analyzeTimetableWithAI = async () => {
    if (grid.length === 0) return;
    setIsAnalyzing(true);
    setAiInsights(null);
    setAiWarnings([]);
    try {
      const payloadSlots = grid.map(cell => ({
        day_of_week: cell.day,
        period_number: cell.period,
        subject_name: cell.subject_name,
        teacher_name: cell.teacher_name,
        teacher_id: cell.teacher_id,
        subject_id: cell.subject_id
      }));

      // Log request details during debugging
      console.log("Request URL: /admin/timetable/analyze");
      console.log("Request Payload:", {
        slots: payloadSlots,
        class_name: selectedClass?.name || "Class",
        working_days: workingDays,
        periods_per_day: periodsPerDay
      });

      const res = await adminService.analyzeTimetable({
        slots: payloadSlots,
        class_name: selectedClass?.name || "Class",
        working_days: workingDays,
        periods_per_day: periodsPerDay
      });

      console.log("Response data:", res);

      if (res.success && res.data) {
        setAiInsights(res.data.analysis || "No analysis available.");
        setAiWarnings(res.data.warnings || []);
        toast.success("AI Analysis compiled!");
      } else {
        throw new Error(res.message || "Failed to analyze timetable.");
      }
    } catch (e: any) {
      console.error("AI Analysis error:", e);
      const errMsg = e instanceof Error ? e.message : "Failed to compile AI insights.";
      setAiInsights(`Failed to fetch AI insights: ${errMsg}`);
      toast.error(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Grid cell update ─────────────────────────────────────────────────────────

  const updateCell = useCallback((day: string, period: number, field: "subject" | "teacher", value: string) => {
    setGrid(prev => prev.map(cell => {
      if (cell.day !== day || cell.period !== period) return cell;
      if (field === "subject") {
        const sub = subjects.find(s => s.id === Number(value));
        return {
          ...cell,
          subject_id: sub?.id ?? null,
          subject_name: sub?.name ?? "",
          teacher_id: null,
          teacher_name: ""
        };
      } else {
        const tea = teachers.find(t => t.id === Number(value));
        return { ...cell, teacher_id: tea?.id ?? null, teacher_name: tea?.name ?? "" };
      }
    }));
    setValidationErrors([]);
  }, [subjects, teachers]);

  // ── Client-side conflict validation ─────────────────────────────────────────

  const validateGrid = (): string[] => {
    const errors: string[] = [];
    const teacherSlotMap = new Map<string, string>();
    const subjectSlotMap = new Map<string, string>();

    // 1. Verify at least one teacher selected
    if (selectedTeacherIds.length === 0) {
      errors.push("Please select at least one teacher.");
    }

    // 2. Count PE periods and validate them
    const pePeriods = grid.filter(
      c => c.subject_name.toLowerCase() === "physical education" || c.subject_name.toLowerCase() === "pe"
    );

    if (pePeriods.length < 2) {
      errors.push("Each class timetable must contain at least 2 Physical Education (PE) periods per week before publishing.");
    }

    for (const peCell of pePeriods) {
      if (!peCell.teacher_id) {
        errors.push(`PE period on ${peCell.day} Period ${peCell.period} must have a valid Physical Education teacher assigned.`);
      } else {
        const teacherObj = teachers.find(t => t.id === peCell.teacher_id);
        if (teacherObj && !isPeTeacher(teacherObj)) {
          errors.push(`Teacher ${peCell.teacher_name} assigned to PE period on ${peCell.day} Period ${peCell.period} is not a valid PE/Sports teacher.`);
        }
      }
    }

    // 3. Grid validation (conflict check, selected list check, and empty cell check)
    for (const cell of grid) {
      if (!cell.subject_id) {
        errors.push(`Period ${cell.period} on ${cell.day} has no subject assigned. All slots are mandatory.`);
        continue;
      }

      if (!cell.teacher_id) {
        errors.push(`Period ${cell.period} on ${cell.day} has no teacher assigned. All slots are mandatory.`);
        continue;
      }

      // Check if the assigned teacher is part of the selected teacher list
      if (!selectedTeacherIds.includes(cell.teacher_id)) {
        errors.push(`Teacher ${cell.teacher_name} assigned on ${cell.day} Period ${cell.period} is not in the selected teachers list.`);
      }

      const slotKey = `${cell.day}|P${cell.period}`;

      // Double-booking check within the current class grid
      const teacherKey = `${cell.teacher_id}|${cell.day}|${cell.period}`;
      if (teacherSlotMap.has(teacherKey)) {
        errors.push(`${cell.teacher_name} is assigned twice on ${cell.day} Period ${cell.period}.`);
      } else {
        teacherSlotMap.set(teacherKey, slotKey);
      }

      // Duplicate subject check within the same period on the same day
      const subjectKey = `${cell.subject_id}|${cell.day}|${cell.period}`;
      if (subjectSlotMap.has(subjectKey)) {
        errors.push(`Duplicate subject "${cell.subject_name}" in Period ${cell.period} on ${cell.day}.`);
      } else {
        subjectSlotMap.set(subjectKey, slotKey);
      }
    }

    return errors;
  };

  // ── Publish ──────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    const errors = validateGrid();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix validation errors before publishing.");
      return;
    }

    if (!selectedClassId) return;
    setIsPublishing(true);
    try {
      const slots = grid.map(cell => ({
        class_id: selectedClassId,
        subject_id: cell.subject_id!,
        teacher_id: cell.teacher_id ?? undefined,
        day_of_week: cell.day,
        period_number: cell.period,
        start_time: PERIOD_TIMES[cell.period]?.start ?? "09:00",
        end_time: PERIOD_TIMES[cell.period]?.end ?? "09:45",
      }));

      const res = await adminService.publishTimetable({
        class_id: selectedClassId,
        working_days: workingDays === 5 ? DAYS_5 : DAYS_6,
        periods_per_day: periodsPerDay,
        slots
      });
      if (res.success && res.data) {
        setPublishedSlots(res.data);
        toast.success("🎉 Timetable published successfully! Students and teachers can now view it.");
      }
    } catch (err: any) {
      let errorsList: string[] = [];
      if (err && typeof err === "object") {
        const errorDetail = err.detail;
        if (Array.isArray(errorDetail)) {
          errorDetail.forEach((e: any) => {
            if (e && typeof e === "object") {
              const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : "";
              const msg = e.msg || "Field required";
              errorsList.push(field ? `${field}: ${msg}` : msg);
            } else {
              errorsList.push(String(e));
            }
          });
        } else if (typeof errorDetail === "string") {
          errorsList.push(errorDetail);
        } else {
          const msg = err.message || "Publish failed";
          errorsList.push(msg);
        }
      } else {
        errorsList.push("Publish failed");
      }
      
      toast.error(errorsList[0] || "Publish failed");
      setValidationErrors(errorsList);
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Load existing timetable for selected class ────────────────────────────────

  const loadExistingTimetable = async (classId: number) => {
    try {
      const res = await adminService.getTimetable(classId);
      if (res.success && res.data && res.data.length > 0) {
        setPublishedSlots(res.data);
      }
    } catch {
      // Silently ignore
    }
  };

  useEffect(() => {
    if (selectedClassId) loadExistingTimetable(selectedClassId);
  }, [selectedClassId]);

  // ── Selected class name ────────────────────────────────────────────────────────
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const days = workingDays === 5 ? DAYS_5 : DAYS_6;

  // ─── Published timetable organized by day ─────────────────────────────────────
  const publishedByDay = publishedSlots
    ? DAYS_5.reduce((acc, day) => {
        const daySlots = publishedSlots.filter(s => s.day_of_week === day).sort((a, b) => a.period_number - b.period_number);
        if (daySlots.length > 0) acc[day] = daySlots;
        return acc;
      }, {} as Record<string, TimetableSlotDTO[]>)
    : null;

  const handleEditTimetable = () => {
    if (publishedSlots && publishedSlots.length > 0) {
      const mappedGrid: GridCell[] = publishedSlots.map(s => ({
        day: s.day_of_week,
        period: s.period_number,
        subject_id: s.subject_id,
        subject_name: s.subject_name || "",
        teacher_id: s.teacher_id,
        teacher_name: s.teacher_name || ""
      }));
      setGrid(mappedGrid);
      setPublishedSlots(null);
      setStep(4);
      toast.info("✏️ Existing timetable loaded into editor grid.");
    }
  };

  const handleRecreateTimetable = async () => {
    setPublishedSlots(null);
    setGrid([]);
    setStep(4);
    toast.info("🔄 Regenerating conflict-free timetable...");
    await generateAutomaticTimetable();
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Management"
        subtitle="Create and publish class timetables with guided setup"
        actions={
          selectedClassId && publishedSlots ? (
            <button
              onClick={() => { setStep(1); setPublishedSlots(null); setSelectedClassId(null); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
            >
              <CalendarCheck size={14} />
              Create New Timetable
            </button>
          ) : null
        }
      />

      {/* ── Published Timetable Preview ─────────────────────────────────────── */}
      {publishedSlots && publishedByDay && step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Published Timetable — {selectedClass?.name ?? `Class #${selectedClassId}`}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {publishedSlots.length} slot(s) published and visible to students & teachers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEditTimetable}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors shadow-sm"
              >
                <Edit3 size={13} /> Edit Timetable
              </button>
              <button
                onClick={handleRecreateTimetable}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <RefreshCw size={13} /> Recreate
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(publishedByDay).map(([day, slots]) => (
              <div key={day} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="px-4 py-2 bg-[var(--primary)]/10 border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--primary)]">{day}</span>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {slots.map(slot => (
                    <div key={slot.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-xs font-mono text-[var(--text-muted)] w-5 shrink-0">P{slot.period_number}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{slot.subject_name ?? `Subject #${slot.subject_id}`}</p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{slot.teacher_name ?? "No teacher"}</p>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{slot.start_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wizard ──────────────────────────────────────────────────────────── */}
      {(!publishedSlots || step > 1) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <StepIndicator step={step} />

          {/* ── STEP 1: Select Class ── */}
          {step === 1 && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <CalendarCheck size={16} className="text-[var(--primary)]" />
                Step 1 — Select Class
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Select the Grade and Section to configure the class timetable.
              </p>

              {loadingClasses ? (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Loader2 size={14} className="animate-spin" /> Loading classes...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Direct Class Selection</label>
                    <select
                      value={selectedClassId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const id = Number(val);
                          setSelectedClassId(id);
                          const cls = classes.find(c => c.id === id);
                          if (cls) {
                            if (cls.grade) setSelectedGrade(String(cls.grade));
                            if (cls.section) setSelectedSection(String(cls.section));
                          }
                        } else {
                          setSelectedClassId(null);
                        }
                      }}
                      className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                    >
                      <option value="">— Select any Class from Database —</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name ? c.name : (c.grade && c.section ? `Grade ${c.grade}-${c.section}` : `Class #${c.id}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[var(--border)]"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-[var(--text-muted)] uppercase tracking-wider">or filter by Grade & Section</span>
                    <div className="flex-grow border-t border-[var(--border)]"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Select Grade</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">— Select Grade —</option>
                        {uniqueGrades.map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Select Section</label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="">— Select Section —</option>
                        {uniqueSections.map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(selectedClassId || (selectedGrade && selectedSection)) && (
                    <div className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block">Selected Class Target</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {selectedClass ? (selectedClass.name || `Grade ${selectedClass.grade}-${selectedClass.section}`) : `Class #${selectedClassId}`}
                        </span>
                      </div>
                      {selectedClassId ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500" />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={goStep2}
                  disabled={!selectedClassId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white disabled:opacity-40 hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Configure Grid ── */}
          {step === 2 && (
            <div className="max-w-lg space-y-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BookOpen size={16} className="text-[var(--primary)]" />
                Step 2 — Configure Timetable Grid
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Class: <strong className="text-[var(--text-primary)]">{selectedClass?.name}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Working Days</label>
                  <div className="flex gap-3">
                    {([5, 6] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setWorkingDays(d)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                          workingDays === d
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        {d === 5 ? "Mon – Fri (5 days)" : "Mon – Sat (6 days)"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">
                    Periods per day: <strong className="text-[var(--primary)]">{periodsPerDay}</strong>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 6, 7, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => setPeriodsPerDay(n)}
                        className={`w-10 h-10 rounded-lg text-xs font-semibold border transition-all ${
                          periodsPerDay === n
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    Grid size: {workingDays} days × {periodsPerDay} periods = <strong className="text-[var(--primary)]">{workingDays * periodsPerDay} total slots</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={goStep3} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors">
                  Load Teachers <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Select Teachers ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Users size={16} className="text-[var(--primary)]" />
                Step 3 — Select Teachers
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Select which teachers will participate in this timetable. Only selected teachers will be available for assignment.
              </p>

              {loadingTeachers ? (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] py-4">
                  <Loader2 size={14} className="animate-spin" /> Loading teachers...
                </div>
              ) : teachers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">No teachers found. Add teachers first.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teachers.map(t => (
                    <div
                      key={t.id}
                      className={`relative rounded-lg border p-3 space-y-1.5 transition-all ${
                        selectedTeacherIds.includes(t.id)
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] bg-[var(--background)] opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`teacher-check-${t.id}`}
                          checked={selectedTeacherIds.includes(t.id)}
                          onChange={() => {
                            setSelectedTeacherIds(prev =>
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] bg-[var(--background)] cursor-pointer shrink-0"
                        />
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label htmlFor={`teacher-check-${t.id}`} className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer truncate block">
                            {t.name}
                          </label>
                          <p className="text-[10px] text-[var(--text-muted)] truncate">{t.email}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium shrink-0">
                          {t.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-secondary)]">Subject:</span> {t.subject_name}
                      </div>
                      {t.assigned_classes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {t.assigned_classes.map(c => (
                            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/60 text-[var(--text-muted)]">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={goStep4} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors">
                  Build Grid <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Timetable Verification & Publish ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Eye size={16} className="text-[var(--primary)]" />
                    Step 4 — Verify & Publish
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Class: <strong className="text-[var(--text-primary)]">{selectedClass?.name}</strong> · {workingDays} days · {periodsPerDay} periods/day
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateAutomaticTimetable}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <RefreshCw size={13} /> Regenerate
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {isPublishing ? "Accept & Publish" : "Accept & Publish"}
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400 mb-2">
                    <AlertCircle size={14} /> Timetable Generation Warning
                  </div>
                  {validationErrors.map((e, i) => {
                    const message = typeof e === "object" && e !== null ? ((e as any).message || (e as any).detail || JSON.stringify(e)) : String(e);
                    return (
                      <p key={i} className="text-xs text-red-400/90">• {message}</p>
                    );
                  })}
                </div>
              )}

              {/* Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse min-w-[600px] border border-[var(--border)]">
                  <thead>
                    <tr>
                      <th className="py-3 px-4 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase w-28 bg-[var(--background)] border border-[var(--border)]">
                        Period
                      </th>
                      {days.map(day => (
                        <th key={day} className="py-3 px-4 text-center text-[10px] font-semibold text-[var(--primary)] uppercase bg-[var(--primary)]/5 border border-[var(--border)]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: periodsPerDay }, (_, pi) => {
                      const period = pi + 1;
                      const times = PERIOD_TIMES[period];
                      return (
                        <tr key={period} className="group hover:bg-[var(--surface-hover)]">
                          <td className="py-3 px-4 border border-[var(--border)] bg-[var(--background)] font-medium text-[var(--text-muted)]">
                            <span className="text-[var(--text-primary)] font-semibold">Period {period}</span>
                            <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">{times?.start}–{times?.end}</span>
                          </td>
                          {days.map(day => {
                            const cell = grid.find(c => c.day === day && c.period === period);
                            if (!cell) return <td key={day} className="border border-[var(--border)]" />;
                            const hasConflict = validationErrors.some(e => e.includes(`Period ${period}`) && e.includes(day));
                            return (
                              <td
                                key={day}
                                className={`border border-[var(--border)] p-3 align-middle text-center ${hasConflict ? "bg-red-500/5" : "bg-[var(--surface)]"}`}
                              >
                                <div className="font-semibold text-xs text-[var(--text-primary)]">
                                  {cell.subject_name || <span className="text-red-400 italic">Unassigned</span>}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                                  {cell.teacher_name || <span className="text-red-400/70 italic">Unassigned</span>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* AI Analysis Section */}
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">AI Timetable Insights</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">Analyze balance, workload distribution, and teacher assignments.</p>
                  </div>
                  <button
                    onClick={analyzeTimetableWithAI}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                    {isAnalyzing ? "Analyzing..." : "Analyze Timetable"}
                  </button>
                </div>

                {aiInsights && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] mb-2">
                      <CalendarCheck size={14} /> AI Schedule Evaluation
                    </div>

                    {aiWarnings && aiWarnings.length > 0 && (
                      <div className="mb-3 p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-1">
                        <div className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                          <AlertCircle size={13} /> Timetable Warnings Detected
                        </div>
                        {aiWarnings.map((w, idx) => {
                          const message = typeof w === "object" && w !== null ? (w.message || w.detail || JSON.stringify(w)) : String(w);
                          return (
                            <div key={idx} className="text-[11px] text-red-400/90">• {message}</div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-line leading-relaxed">{aiInsights}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <button onClick={() => setStep(3)} className="flex items-center gap-1.5 px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Accept & Publish
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
