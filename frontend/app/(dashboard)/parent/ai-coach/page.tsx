"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonMessage } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { useAICoach } from "@/hooks/parent/use-ai-coach";
import { Bot, Send, User, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic text-[var(--text-secondary)]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderMarkdownText(content: string) {
  const lines = content.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mt-3 mb-1">
          {formatInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">
          {formatInlineMarkdown(trimmed.slice(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      return (
        <li key={idx} className="ml-4 list-disc text-xs text-[var(--text-primary)] leading-relaxed">
          {formatInlineMarkdown(trimmed.slice(2))}
        </li>
      );
    }
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="flex gap-2 text-xs text-[var(--text-primary)] leading-relaxed mt-1">
          <span className="font-bold text-[var(--primary)] font-mono">{numMatch[1]}.</span>
          <div>{formatInlineMarkdown(numMatch[2])}</div>
        </div>
      );
    }

    return (
      <p key={idx} className="text-xs text-[var(--text-primary)] leading-relaxed">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  });
}

export default function ParentAICoachPage() {
  const { history, isLoading, isAsking, error, askCoach, refetch } = useAICoach();
  const [query, setQuery] = useState("");
  const [activeAdvice, setActiveAdvice] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const res = await askCoach(query.trim());
    if (res) {
      setActiveAdvice(res);
      setQuery("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="AI Parent Coach" subtitle="Loading advice history..." />
        <SkeletonMessage />
        <SkeletonMessage align="right" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="AI Parent Coach" subtitle="Parenting & Home Study Advisory Engine" />
        <ErrorState title="Could not connect to AI Coach" message={error} onRetry={refetch} />
      </div>
    );
  }

  const currentResponse = activeAdvice || (history.length > 0 ? history[0] : null);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="AI Parent Coach Advisory"
        subtitle="Conversational AI guide for home study routines, parenting strategies, and progress interpretation"
      />

      {/* Split Pane Chat Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[560px]">
        {/* Left History List */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col h-full">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
            <MessageSquare size={14} className="text-[var(--primary)]" />
            Query History
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] p-2">No query history yet.</p>
            ) : (
              history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAdvice(item)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border text-xs transition-colors",
                    currentResponse === item
                      ? "bg-[var(--surface-hover)] border-[var(--border-accent)] text-[var(--text-primary)]"
                      : "bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <p className="font-medium truncate">
                    {String(item.query || item.advice || `Query #${idx + 1}`)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Active Chat Panel */}
        <div className="md:col-span-2 p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between h-full">
          {/* Chat Message Viewport */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {currentResponse ? (
              <div className="space-y-4">
                {/* AI Coach Message Card */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] space-y-3">
                  <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
                    <div className="p-1.5 rounded-md bg-[var(--primary)] text-white">
                      <Bot size={14} />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[var(--primary)]" /> AI Parent Coach Guidance
                    </span>
                  </div>

                  <div className="space-y-1">
                    {renderMarkdownText(
                      String(currentResponse.advice || currentResponse.response || "")
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Ask the AI Parent Coach"
                description="Type any question below regarding study habits, exam anxiety, or how to interpret school reports."
                icon={Bot}
              />
            )}
          </div>

          {/* Query Form Input */}
          <form onSubmit={handleSubmit} className="pt-3 border-t border-[var(--border)] flex gap-2">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question (e.g. How can I help my child prepare for math exams without stress?)..."
              className={cn(
                "flex-1 h-9 px-3 rounded-md text-xs",
                "bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              )}
            />
            <button
              type="submit"
              disabled={isAsking || !query.trim()}
              className="px-4 h-9 rounded-md text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>{isAsking ? "Thinking..." : "Send"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
