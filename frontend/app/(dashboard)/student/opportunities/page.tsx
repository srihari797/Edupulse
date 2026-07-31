"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { SkeletonGrid } from "@/components/common/skeleton";
import { ErrorState, EmptyState } from "@/components/common/states";
import { Badge } from "@/components/common/badge";
import { Lightbulb, Calendar, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

interface OpportunityItem {
  id: number;
  title: string;
  description: string;
  opportunity_type: string;
  organization: string;
  deadline: string;
  recommended_reason: string;
}

export default function StudentOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>("/students/opportunities");
      const list = Array.isArray(res) ? res : (res?.data || []);
      setOpportunities(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load opportunities");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Opportunities" subtitle="Loading recommended competitions & scholarships..." />
        <SkeletonGrid count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Opportunities" subtitle="Personalized Opportunity Recommendations" />
        <ErrorState title="Could not load opportunities" message={error} onRetry={fetchOpportunities} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized Opportunity Matching"
        subtitle="Scholarships, competitions, hackathons, and clubs matched by AI to your Growth Passport profile in PostgreSQL"
      />

      {opportunities.length === 0 ? (
        <EmptyState
          title="No opportunity matches found"
          description="Check back soon as new competitions and scholarships are posted."
          icon={Lightbulb}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between space-y-4 shadow-sm hover:border-[var(--border-accent)] transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {opp.title}
                  </h3>
                  <Badge variant="primary">{opp.opportunity_type}</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {opp.description}
                </p>
              </div>

              {/* AI Recommendation Reason Banner */}
              <div className="p-3.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-start gap-2.5">
                <Sparkles size={16} className="text-[var(--primary)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--primary)] font-medium">
                  <span className="font-bold">Matched: </span>
                  {opp.recommended_reason}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1 font-mono font-medium text-[var(--warning)]">
                  <Calendar size={13} /> Deadline: {opp.deadline}
                </span>
                <span className="font-bold text-[var(--text-secondary)]">
                  {opp.organization}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
