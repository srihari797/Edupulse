import { Sparkles } from "lucide-react";
import { AIConfidenceBar } from "@/components/common/ai-confidence";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
  title?: string;
  analysis: string;
  confidence?: number;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * AIInsightCard — EduPulse AI insight container.
 * Lavender-blue left border accent, Lucide Sparkles icon, AI analysis narrative box, confidence bar.
 */
export function AIInsightCard({
  title = "AI Intelligence Insight",
  analysis,
  confidence = 92,
  actions,
  className,
}: AIInsightCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-4 rounded-lg ai-border",
        "border border-[var(--border)]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-[var(--primary)]/15 text-[var(--primary)] shrink-0">
            <Sparkles size={12} strokeWidth={2} />
          </div>
          <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
            {title}
          </h4>
        </div>
        {actions}
      </div>

      {/* Narrative Analysis Body */}
      <div className="my-2 space-y-1">
        {renderMarkdown(analysis)}
      </div>

      {/* Confidence Bar */}
      {confidence !== undefined && (
        <div className="mt-3 pt-2 border-t border-[var(--border)]">
          <AIConfidenceBar confidence={confidence} />
        </div>
      )}
    </div>
  );
}

function formatInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[var(--text-primary)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <span key={index} className="font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded text-[11px] inline-block my-0.5">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

function renderMarkdown(content: string) {
  if (!content) return null;
  const lines = content.split("\n");

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const headingText = trimmed.replace(/^#+\s*/, "");
      return (
        <h3 key={idx} className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mt-3 mb-1.5 border-b border-[var(--border)] pb-1">
          {headingText}
        </h3>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const bulletText = trimmed.replace(/^[-*•]\s*/, "");
      return (
        <div key={idx} className="flex items-start gap-2 ml-1 my-1">
          <span className="text-[var(--primary)] font-bold text-xs shrink-0 mt-0.5">•</span>
          <div className="text-xs text-[var(--text-primary)] leading-relaxed flex-1">
            {formatInlineMarkdown(bulletText)}
          </div>
        </div>
      );
    }

    if (!trimmed) {
      return <div key={idx} className="h-1" />;
    }

    return (
      <p key={idx} className="text-xs text-[var(--text-primary)] leading-relaxed my-1">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  });
}
