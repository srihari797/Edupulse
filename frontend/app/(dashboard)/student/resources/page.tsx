"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonGrid } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { BookOpen, Download, FileText, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api, getToken } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

interface ResourceItem {
  id: number;
  subject_name: string;
  teacher_name: string;
  title: string;
  description: string;
  resource_type: string;
  file_bucket: string;
  file_path: string;
  created_at: string;
}

export default function StudentResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/students/resources");
      const list = Array.isArray(res) ? res : (res?.data || []);
      setResources(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDownload = async (resource: ResourceItem) => {
    try {
      toast.info(`Preparing download for ${resource.title}...`);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/students/resources/${resource.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Could not download file from Supabase Storage");
      }

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        if (json.download_url) {
          window.open(json.download_url, "_blank");
          toast.success("Download started!");
          return;
        }
      }

      // Blob binary download fallback
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resource.title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Resource file downloaded!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Learning Resources" subtitle="Loading study materials from database..." />
        <SkeletonGrid count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Learning Resources" subtitle="Classroom Learning Resources" />
        <ErrorState title="Could not load resources" message={error} onRetry={fetchResources} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning Resources & Study Hub"
        subtitle="Course materials, lecture notes, and reference files shared by teachers in Supabase Storage"
      />

      {resources.length === 0 ? (
        <EmptyState
          title="No learning resources available"
          description="Your teachers haven't uploaded any study materials yet."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4 shadow-sm hover:border-[var(--border-accent)] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--primary)]/15 text-[var(--primary)]">
                    {item.subject_name}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                    <Calendar size={11} /> {item.created_at}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1">
                      {item.description || "Course study reference file"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                  <UserCheck size={13} /> {item.teacher_name}
                </span>
                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
