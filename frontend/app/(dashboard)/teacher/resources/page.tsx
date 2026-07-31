"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Library, Upload, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function TeacherResourcesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("subject_id", subjectId.toString());
      formData.append("title", title.trim());
      if (description) formData.append("description", description.trim());
      formData.append("class_name", "Grade-10A");
      formData.append("subject_name", "General");
      formData.append("file", selectedFile);

      const res = await api.post<{ success: boolean; message: string }>("/teacher/resources/upload", formData);

      if (res.success) {
        toast.success("Learning resource uploaded to Supabase Storage successfully!");
        setTitle("");
        setDescription("");
        setSelectedFile(null);
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Upload Learning Resource to Supabase"
        subtitle="Publish study guides, lecture notes, and reference files directly into Supabase Storage"
      />

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-sm">
        <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Library size={16} className="text-[var(--primary)]" />
          Resource Upload Form
        </h3>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
            Resource Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Physics Chapter 4 - Summary & Formula Sheet"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
            Resource Description
          </label>
          <textarea
            rows={3}
            placeholder="Provide overview details for students..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
          />
        </div>

        {/* File Picker */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">
            Upload Document File (PDF, DOCX, Images) *
          </label>
          <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-4 text-center bg-[var(--background)] hover:border-[var(--primary)] transition-colors">
            <input
              type="file"
              required
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
              id="resource-file-input"
            />
            <label htmlFor="resource-file-input" className="cursor-pointer space-y-1 block">
              <Upload size={24} className="mx-auto text-[var(--primary)]" />
              {selectedFile ? (
                <div>
                  <span className="font-bold text-xs text-[var(--text-primary)] block">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-xs text-[var(--text-primary)] block">
                    Click to select file for Supabase Upload
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Target bucket: edupulse-resources (Public)
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !title.trim() || !selectedFile}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Upload size={14} />
            <span>{isUploading ? "Uploading to Supabase..." : "Upload to Supabase Storage"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
