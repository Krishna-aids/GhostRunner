/**
 * HealingQueueView — Real Supabase-backed Repair Queue
 *
 * Fetches all repair_proposals for this owner's runs from Supabase,
 * subscribes to Realtime inserts so new proposals appear instantly,
 * and lets the user navigate to a proposal's RunDetailPage.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { RepairProposal } from '../types/domain';
import { apiFetch, normalizeConfidenceForDisplay } from '../lib/api';
import { DEFAULT_OWNER_ID } from '../lib/demoStore';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface HealingQueueViewProps {
  /** If provided, fetches proposals for this specific owner. Falls back to auth user. */
  ownerId?: string;
  /** Navigate to the RunDetailPage for a run */
  onOpenRun?: (runId: string, testDefinitionId?: string) => void;
  onOpenTestRuns: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending:        { label: 'Pending Review', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',     icon: 'pending' },
  validated_pass: { label: 'Validated ✓',    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',        icon: 'verified' },
  approved:       { label: 'Approved',        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: 'check_circle' },
  rejected:       { label: 'Rejected',        color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30',       icon: 'cancel' },
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  LOCATOR_DRIFT:             { label: 'Locator Drift',         icon: 'location_searching', color: 'text-amber-500' },
  UI_FUNCTIONAL_REGRESSION:  { label: 'UI Regression',         icon: 'bug_report',         color: 'text-orange-500' },
  API_FAILURE:               { label: 'API Failure',           icon: 'api',                color: 'text-red-500' },
  ASSERTION_FAILURE:         { label: 'Assertion Failure',     icon: 'rule',               color: 'text-rose-500' },
  ENVIRONMENT_FAILURE:       { label: 'Environment Error',     icon: 'dns',                color: 'text-purple-500' },
  AMBIGUOUS_REQUIRES_REVIEW: { label: 'Needs Manual Review',   icon: 'help_center',        color: 'text-slate-500' },
};

export const HealingQueueView: React.FC<HealingQueueViewProps> = ({
  ownerId: ownerIdProp,
  onOpenRun,
  onOpenTestRuns,
}) => {
  const { user } = useAuth();
  const ownerId = ownerIdProp || user?.id || DEFAULT_OWNER_ID;

  const [proposals, setProposals] = useState<RepairProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // ── Load proposals ────────────────────────────────────────────────────────
  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      // Use Supabase directly for flexibility — join with test_runs to get classification
      const { data, error } = await supabase
        .from('repair_proposals')
        .select(`
          *,
          test_runs (
            id,
            status,
            classification,
            confidence,
            environment_ref,
            test_definition_id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setProposals((data as unknown as RepairProposal[]) || []);
    } catch (err) {
      console.warn('[HealingQueueView] Failed to load proposals:', err);
      // Fallback: try apiFetch which uses local store if Supabase is unconfigured
      try {
        const fallback = await apiFetch<RepairProposal[]>('/repair-proposals', ownerId);
        setProposals(Array.isArray(fallback) ? fallback : []);
      } catch {
        setProposals([]);
      }
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  // ── Realtime: auto-append new proposals as Groq creates them ─────────────
  useEffect(() => {
    const channel = supabase
      .channel('healing-queue-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'repair_proposals' },
        (payload) => {
          console.log('[HealingQueueView] New proposal received via Realtime');
          setProposals((prev) => [payload.new as RepairProposal, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'repair_proposals' },
        (payload) => {
          setProposals((prev) =>
            prev.map((p) => p.id === (payload.new as RepairProposal).id
              ? { ...p, ...(payload.new as RepairProposal) }
              : p
            )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = proposals.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.validation_status === 'pending' || p.validation_status === 'validated_pass';
    return p.validation_status === filter;
  });

  const pendingCount = proposals.filter((p) =>
    p.validation_status === 'pending' || p.validation_status === 'validated_pass'
  ).length;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getRunData = (p: RepairProposal) => (p as any).test_runs || {};
  const getCategory = (p: RepairProposal) => {
    const cat = getRunData(p).classification || 'AMBIGUOUS_REQUIRES_REVIEW';
    return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['AMBIGUOUS_REQUIRES_REVIEW'];
  };
  const getStatusCfg = (p: RepairProposal) =>
    STATUS_CONFIG[p.validation_status] || STATUS_CONFIG['pending'];

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">
              Self-Healing Queue
            </h1>
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-text-secondary text-xs sm:text-sm">
            Review and validate automated selector repair proposals before updating test suites.
          </p>
        </div>
        <button
          type="button"
          onClick={loadProposals}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-canvas text-xs font-medium text-text-primary hover:bg-surface-subtle transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[15px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-surface-subtle p-1 rounded-lg border border-border-subtle w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${
              filter === f
                ? 'bg-surface-canvas text-text-primary shadow-xs border border-border-subtle'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1 text-amber-500 font-semibold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-surface-canvas border border-border-subtle" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center bg-surface-canvas rounded-xl border border-border-subtle">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] text-text-muted">auto_fix_high</span>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-sm text-text-primary">
              {filter === 'all' ? 'No repair proposals' : `No ${filter} proposals`}
            </h3>
            <p className="text-xs text-text-muted max-w-sm">
              {filter === 'all'
                ? 'When automated tests detect locator drift, proposed fixes will appear here for review.'
                : `No proposals found with status "${filter}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenTestRuns}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-95 cursor-pointer shadow-xs"
          >
            View Test Runs
          </button>
        </div>
      )}

      {/* Proposal Cards */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3.5">
          {filtered.map((proposal) => {
            const run = getRunData(proposal);
            const cat = getCategory(proposal);
            const statusCfg = getStatusCfg(proposal);
            const conf = Math.round(normalizeConfidenceForDisplay(proposal.confidence));

            return (
              <div
                key={proposal.id}
                className="bg-surface-canvas rounded-xl border border-border-subtle hover:border-border-strong transition-all p-4.5 flex flex-col gap-3.5 relative shadow-xs"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-status-healed/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[17px] text-status-healed">
                        auto_fix_high
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs sm:text-sm text-text-primary">
                        Automated Repair Proposal
                      </span>
                      <span className="text-[11px] text-text-muted font-mono">
                        {new Date(proposal.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        {run.environment_ref ? ` · ${run.environment_ref}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-start">
                    {/* Category chip */}
                    <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-subtle border border-border-subtle ${cat.color}`}>
                      <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                      {cat.label}
                    </span>

                    {/* Status chip */}
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border uppercase ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Confidence + Reason */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-surface-container rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full bg-status-healed rounded-full transition-all duration-500"
                        style={{ width: `${conf}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-medium text-status-healed shrink-0">
                      {conf}% confidence
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed bg-surface-subtle border border-border-subtle p-3 rounded-lg">
                    <span className="font-medium text-text-primary">Root Cause: </span>
                    {proposal.reason}
                  </p>
                </div>

                {/* Proposed plan preview */}
                {proposal.proposed_plan?.steps?.length > 0 && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 max-h-24 overflow-y-auto border border-border-subtle">
                    <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(proposal.proposed_plan, null, 2).slice(0, 400)}
                      {JSON.stringify(proposal.proposed_plan, null, 2).length > 400 ? '\n...' : ''}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-subtle">
                  <span className="text-[11px] text-text-muted font-mono">
                    run: {proposal.test_run_id?.slice(0, 8)}...
                  </span>
                  <div className="flex items-center gap-2">
                    {onOpenRun && (
                      <button
                        type="button"
                        onClick={() => onOpenRun(proposal.test_run_id, run.test_definition_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        View Run
                      </button>
                    )}
                    {proposal.validation_status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onOpenRun?.(proposal.test_run_id, run.test_definition_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-all"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        Review &amp; Approve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
