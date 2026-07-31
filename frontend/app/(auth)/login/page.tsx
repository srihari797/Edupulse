"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError, initialize } =
    useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect away from login page
  useEffect(() => {
    initialize().then(() => {
      const user = useAuthStore.getState().user;
      if (user) {
        const paths: Record<number, string> = {
          1: "/student/dashboard",
          2: "/parent/dashboard",
          3: "/teacher/dashboard",
          4: "/admin/dashboard",
        };
        router.replace(paths[user.role_id ?? 1] ?? "/student/dashboard");
      }
    });
  }, [initialize, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      const redirectPath = await login({ username: email, password });
      router.push(redirectPath);
    } catch {
      // Error is stored in the auth store — displayed below
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      {/* Background subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* ── Card ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">

          {/* ── Logo + Title ── */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: "#5e6ad2" }}
            >
              <span className="text-white font-bold text-sm tracking-tight">EP</span>
            </div>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                Sign in to EduPulse
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                AI-Powered Holistic Student Development
              </p>
            </div>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[var(--danger)]/10 border border-[var(--danger)]/20 mb-5"
            >
              <AlertCircle size={14} className="text-[var(--danger)] shrink-0" />
              <p className="text-sm text-[var(--danger)]">{error}</p>
            </motion.div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate suppressHydrationWarning className="space-y-4">

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  suppressHydrationWarning
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="you@edupulse.edu"
                  className={cn(
                    "w-full h-9 pl-9 pr-3 rounded-md text-sm",
                    "bg-[var(--background)] border border-[var(--border)]",
                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                    "transition-colors duration-150"
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  strokeWidth={1.5}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  suppressHydrationWarning
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  className={cn(
                    "w-full h-9 pl-9 pr-9 rounded-md text-sm",
                    "bg-[var(--background)] border border-[var(--border)]",
                    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent",
                    "transition-colors duration-150"
                  )}
                />
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={14} strokeWidth={1.5} />
                  ) : (
                    <Eye size={14} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={submitting || !email || !password}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full h-9 rounded-md text-sm font-medium mt-2",
                "bg-[var(--primary)] text-white",
                "hover:bg-[var(--primary-hover)] transition-colors duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          {/* ── Demo credentials hint ── */}
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] text-center mb-2">
              Demo credentials
            </p>
            <div className="space-y-1">
              {[
                { role: "Student", email: "rahul.b@edupulse.edu" },
                { role: "Teacher", email: "david.miller@teacher.edupulse.edu" },
                { role: "Parent", email: "sarah.b@parent.edupulse.edu" },
                { role: "Admin", email: "admin@edupulse.edu" },
              ].map(({ role, email: demoEmail }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setEmail(demoEmail);
                    setPassword("password");
                    clearError();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors text-left"
                >
                  <span className="font-medium">{role}</span>
                  <span className="text-[var(--text-muted)] font-mono truncate ml-2">
                    {demoEmail}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-5">
          Password for all demo accounts:{" "}
          <code className="font-mono bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
            password
          </code>
        </p>
      </motion.div>
    </div>
  );
}
