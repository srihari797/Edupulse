"use client";

import { useState, useRef, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/stores/auth.store";
import {
  Camera,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UserCheck,
  ShieldCheck,
  Database,
  History,
  Sparkles,
  AlertCircle,
  Video,
  VideoOff,
  Lock,
  ShieldAlert,
} from "lucide-react";

const VISION_API_BASE = process.env.NEXT_PUBLIC_VISION_API_BASE_URL || "http://localhost:8001";

interface AttendanceRecord {
  student_id: string;
  student_name: string;
  attendance_date: string;
  timestamp: string;
  confidence: number;
  status: string;
}

interface RegisteredStudent {
  student_id: string;
  student_name: string;
  registered_at: string;
  sample_count: number;
}

export default function StudentAttendancePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"mark" | "register" | "history">("mark");

  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Form & Registration State
  const [regStudentId, setRegStudentId] = useState<string>("");
  const [regStudentName, setRegStudentName] = useState<string>("");
  const [regProgress, setRegProgress] = useState<number>(0);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [capturedSnapshots, setCapturedSnapshots] = useState<string[]>([]);
  const [isFaceRegistered, setIsFaceRegistered] = useState<boolean>(false);
  const [registeredProfile, setRegisteredProfile] = useState<any>(null);

  // Recognition / Mark Attendance State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);

  // Data Tables State
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // Initialize Student Info from Auth & Check Face Vector Registration
  useEffect(() => {
    if (user) {
      const defaultId = user.id ? `STD-${user.id}` : "STD-101";
      const fullName = `${user.first_name || "Student"} ${user.last_name || ""}`.trim();
      setRegStudentId(defaultId);
      setRegStudentName(fullName);
      checkFaceRegistration(defaultId);
    }
  }, [user]);

  // Handle Tab Switch
  useEffect(() => {
    if (activeTab === "history") {
      fetchAttendanceHistory();
      fetchRegisteredStudents();
      stopCamera();
    } else {
      startCamera();
    }
  }, [activeTab]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Check if current account face is registered in VectorDB
  const checkFaceRegistration = async (studentId: string) => {
    try {
      const res = await fetch(`${VISION_API_BASE}/api/vision/check_registration/${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (data.status === "success" && data.is_registered) {
        setIsFaceRegistered(true);
        setRegisteredProfile(data.data);
      } else {
        setIsFaceRegistered(false);
        setRegisteredProfile(null);
      }
    } catch (err) {
      console.error("Error checking face registration:", err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Camera Helper Functions
  // ─────────────────────────────────────────────────────────────────────────

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== "AbortError") {
            console.warn("Camera play interrupted:", playErr);
          }
        }
        setIsCameraActive(true);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Camera access error:", err);
        setCameraError("Unable to access camera. Please allow camera permissions in browser.");
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      try {
        videoRef.current.pause();
      } catch (e) {
        // Ignore pause exception on stopped stream
      }
    }
    setIsCameraActive(false);
  };

  const captureFrameBase64 = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Mark Attendance Function (with Account Security Binding)
  // ─────────────────────────────────────────────────────────────────────────

  const handleMarkAttendance = async () => {
    const frameB64 = captureFrameBase64();
    if (!frameB64) {
      alert("Camera frame not ready. Make sure camera is active.");
      return;
    }

    setIsProcessing(true);
    setRecognitionResult(null);

    try {
      const response = await fetch(`${VISION_API_BASE}/api/vision/mark_base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: frameB64,
          student_id: regStudentId, // Pass active logged-in student account ID
        }),
      });

      const data = await response.json();
      setRecognitionResult(data);

      if (data.matched) {
        fetchAttendanceHistory();
      }
    } catch (err: any) {
      console.error("Attendance API Error:", err);
      setRecognitionResult({
        status: "error",
        matched: false,
        message: `Could not connect to Vision Service at ${VISION_API_BASE}. Ensure server is running.`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Register Face Vector Function
  // ─────────────────────────────────────────────────────────────────────────

  const [captureGuidance, setCaptureGuidance] = useState<string>("");

  const handleRegisterFace = async () => {
    if (!regStudentId.trim() || !regStudentName.trim()) {
      alert("Please enter Student ID and Name.");
      return;
    }

    setIsRegistering(true);
    setRegProgress(5);
    setCapturedSnapshots([]);

    const snapshots: string[] = [];
    const guidancePrompts = [
      "Look straight at camera",
      "Look straight at camera",
      "Turn head slightly left",
      "Turn head slightly left",
      "Turn head slightly right",
      "Turn head slightly right",
      "Tilt head slightly up",
      "Tilt head slightly down",
      "Natural expression",
      "Finalizing 10 snapshots...",
    ];

    for (let i = 0; i < 10; i++) {
      setCaptureGuidance(guidancePrompts[i]);
      await new Promise((res) => setTimeout(res, 300));
      const frame = captureFrameBase64();
      if (frame) {
        snapshots.push(frame);
        setCapturedSnapshots([...snapshots]);
      }
      setRegProgress(Math.round(((i + 1) / 10) * 100));
    }

    setCaptureGuidance("Indexing 10 vector embeddings into VectorDB...");

    if (snapshots.length === 0) {
      alert("Could not capture video frames. Check camera.");
      setIsRegistering(false);
      setRegProgress(0);
      return;
    }

    try {
      const response = await fetch(`${VISION_API_BASE}/api/vision/register_base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: regStudentId.trim(),
          student_name: regStudentName.trim(),
          images_base64: snapshots,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        alert(`Successfully registered face vector for ${regStudentName}!`);
        checkFaceRegistration(regStudentId.trim());
        setActiveTab("mark");
      } else {
        alert(data.detail || data.message || "Registration failed.");
      }
    } catch (err: any) {
      console.error("Register API Error:", err);
      alert(`Registration failed: Could not connect to ${VISION_API_BASE}`);
    } finally {
      setIsRegistering(false);
      setRegProgress(0);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Logs & Registrations
  // ─────────────────────────────────────────────────────────────────────────

  const fetchAttendanceHistory = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${VISION_API_BASE}/api/vision/attendance?student_id=${encodeURIComponent(regStudentId)}`);
      const data = await res.json();
      if (data.data) {
        setAttendanceLogs(data.data);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchRegisteredStudents = async () => {
    try {
      const res = await fetch(`${VISION_API_BASE}/api/vision/registered_students`);
      const data = await res.json();
      if (data.data) {
        setRegisteredStudents(data.data);
      }
    } catch (err) {
      console.error("Error fetching registered students:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <PageHeader
        title="AI Vision Attendance & Vector DB"
        subtitle="Real-Time Facial Recognition Attendance Powered by Vector Search"
        actions={
          <div className="flex items-center gap-2">
            {isFaceRegistered ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)]">
                <CheckCircle2 size={14} />
                <span>Face Vector Registered</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--warning)]/15 border border-[var(--warning)]/30 text-[var(--warning)]">
                <Lock size={14} />
                <span>Registration Pending</span>
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)]">
              <Database size={14} className="text-[var(--primary)]" />
              <span>Vector DB: Online</span>
            </span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab("mark")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "mark"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
          }`}
        >
          <Camera size={15} />
          <span>Mark Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "register"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
          }`}
        >
          <UserCheck size={15} />
          <span>Register Face Vector {isFaceRegistered && "(Registered)"}</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
          }`}
        >
          <History size={15} />
          <span>Attendance Records</span>
        </button>
      </div>

      {/* Tab 1: Mark Attendance */}
      {activeTab === "mark" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera View */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Video size={16} className="text-[var(--primary)]" />
                  Live Webcam Scanner
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Account: <strong>{regStudentName}</strong> ({regStudentId})
                </p>
              </div>

              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--danger)]/15 text-[var(--danger)]"
                >
                  <VideoOff size={13} /> Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--primary)]/15 text-[var(--primary)]"
                >
                  <Video size={13} /> Start Camera
                </button>
              )}
            </div>

            {/* Video Container with Visual Bounding Overlay */}
            <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[var(--border)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />

              {!isCameraActive && (
                <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                  <VideoOff size={32} />
                  <span className="text-xs">Camera offline</span>
                  <button
                    onClick={startCamera}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white mt-1"
                  >
                    Turn On Camera
                  </button>
                </div>
              )}

              {/* Target Bounding Frame Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full border-2 border-dashed border-[var(--primary)] opacity-80 animate-pulse flex items-center justify-center">
                    <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">Align Face Here</span>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{cameraError}</span>
              </div>
            )}

            <div className="flex items-center justify-center pt-2">
              <button
                onClick={handleMarkAttendance}
                disabled={!isCameraActive || isProcessing}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all shadow-md"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Account & Vector DB...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Scan Face & Mark Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-4">
                Verification & Security Status
              </h3>

              {!recognitionResult ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[var(--text-muted)] space-y-2">
                  <Sparkles size={28} className="text-[var(--primary)] opacity-60" />
                  <p className="text-xs font-medium">Ready for Face Verification</p>
                  <p className="text-[11px]">Click 'Scan Face & Mark Attendance' to verify your identity.</p>
                </div>
              ) : recognitionResult.security_error ? (
                /* ── SECURITY ALERT: PROXY ATTENDANCE BLOCKED ── */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] flex items-start gap-3">
                    <ShieldAlert size={26} className="shrink-0 mt-0.5 text-[var(--danger)] animate-bounce" />
                    <div>
                      <h4 className="font-bold text-sm">Proxy Attendance Blocked!</h4>
                      <p className="text-xs mt-1 leading-relaxed opacity-95">{recognitionResult.message}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--danger)]/20 text-xs space-y-2">
                    <div className="flex justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-muted)]">Active Account</span>
                      <span className="font-bold text-[var(--text-primary)]">{regStudentId}</span>
                    </div>

                    <div className="flex justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-muted)]">Scanned Face Belong To</span>
                      <span className="font-bold text-[var(--danger)]">{recognitionResult.matched_student_name || "Different Person"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Vector Confidence</span>
                      <span className="font-bold text-[var(--text-secondary)]">
                        {(recognitionResult.confidence * 100).toFixed(1)}% Match
                      </span>
                    </div>
                  </div>
                </div>
              ) : recognitionResult.matched ? (
                /* ── SUCCESSFUL MATCH ── */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] flex items-start gap-3">
                    <CheckCircle2 size={22} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Attendance Verified & Marked!</h4>
                      <p className="text-xs opacity-90">{recognitionResult.attendance?.message || "Successfully recorded."}</p>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs">
                    <div className="flex justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-muted)]">Student Name</span>
                      <span className="font-bold text-[var(--text-primary)]">{recognitionResult.student_name}</span>
                    </div>

                    <div className="flex justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-muted)]">Student ID</span>
                      <span className="font-bold text-[var(--text-primary)]">{recognitionResult.student_id}</span>
                    </div>

                    <div className="flex justify-between border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-muted)]">Vector Match Confidence</span>
                      <span className="font-bold text-[var(--success)]">
                        {(recognitionResult.confidence * 100).toFixed(1)}% Match
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Timestamp</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {recognitionResult.attendance?.timestamp || new Date().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── FACE UNKNOWN ── */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--warning)] flex items-start gap-3">
                    <XCircle size={22} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Face Not Recognized</h4>
                      <p className="text-xs opacity-90">{recognitionResult.message}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs space-y-2">
                    <p className="text-[var(--text-secondary)]">
                      If you haven't registered your face vector yet, switch to the <strong>Register Face Vector</strong> tab.
                    </p>
                    <button
                      onClick={() => setActiveTab("register")}
                      className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold mt-1"
                    >
                      Register Face Vector
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Strict Account Anti-Proxy Policy</span>
              <p>Facial embeddings must match the currently logged-in account. Proxy attendance scans are blocked automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Register Face Vector */}
      {activeTab === "register" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
              Register Student Facial Embedding in VectorDB
            </h3>

            {/* REQUIREMENT 1: If face is already registered for this account, show confirmation banner */}
            {isFaceRegistered && registeredProfile && (
              <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>Face Profile Already Registered for this Account</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Your facial vector embedding is active in VectorDB (Registered on{" "}
                  {new Date(registeredProfile.registered_at).toLocaleDateString()}). You do not need to register again to mark daily attendance.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Student ID (Account)</label>
                <input
                  type="text"
                  disabled
                  value={regStudentId}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-primary)] font-mono opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">Full Name</label>
                <input
                  type="text"
                  value={regStudentName}
                  onChange={(e) => setRegStudentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            {/* Camera Box */}
            <div className="relative aspect-video w-full rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[var(--border)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
              />

              {!isCameraActive && (
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white"
                >
                  Start Camera for Registration
                </button>
              )}
            </div>

            {/* Progress Bar & Angle Guidance Prompts */}
            {isRegistering && (
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30">
                <div className="flex justify-between text-xs font-bold text-[var(--primary)]">
                  <span>{captureGuidance || "Capturing Multi-Angle Vector Embeddings..."}</span>
                  <span>{regProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-300"
                    style={{ width: `${regProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleRegisterFace}
              disabled={!isCameraActive || isRegistering}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-all shadow-sm"
            >
              {isRegistering ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing & Indexing Vector...</span>
                </>
              ) : isFaceRegistered ? (
                <>
                  <RefreshCw size={16} />
                  <span>Update / Re-Register Face Vector</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Capture & Save Face Vector</span>
                </>
              )}
            </button>
          </div>

          {/* Guidelines Panel */}
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
              Registration Guidelines
            </h3>

            <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-[10px]">1</span>
                <span>Each account can register one unique face vector embedding in VectorDB.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-[10px]">2</span>
                <span>Ensure good ambient lighting and face the camera directly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="p-1 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-[10px]">3</span>
                <span>Scanning in another student's account will be blocked as proxy attendance.</span>
              </li>
            </ul>

            {capturedSnapshots.length > 0 && (
              <div className="pt-3 border-t border-[var(--border)] space-y-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] block">Captured Snapshots</span>
                <div className="grid grid-cols-2 gap-2">
                  {capturedSnapshots.map((snap, idx) => (
                    <img key={idx} src={snap} alt="Snapshot" className="rounded-lg border border-[var(--border)] object-cover h-20 w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: History & Vector Store */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History size={16} className="text-[var(--primary)]" />
                Attendance Log Records for {regStudentName} ({regStudentId})
              </h3>

              <button
                onClick={fetchAttendanceHistory}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {isLoadingLogs ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">Loading attendance history...</p>
            ) : attendanceLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                No attendance logs found for this account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--background)] text-[var(--text-muted)] border-b border-[var(--border)] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Confidence Score</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                    {attendanceLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-[var(--surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-semibold">{log.student_name}</td>
                        <td className="py-2.5 px-3 font-mono">{log.student_id}</td>
                        <td className="py-2.5 px-3">{log.attendance_date}</td>
                        <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">{log.timestamp}</td>
                        <td className="py-2.5 px-3 font-bold text-[var(--success)]">
                          {(log.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--success)]/15 text-[var(--success)]">
                            {log.status}
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
      )}
    </div>
  );
}
