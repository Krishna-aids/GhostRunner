import React, { useState, useEffect } from 'react';
import { TestRun, EvidenceArtifact, RepairProposal, ActionPlan } from '../../types/domain';
import { apiFetch, normalizeConfidenceForDisplay, normalizeConfidenceForAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { RunStatusBadge } from '../shared/RunStatusBadge';
import { FailureCategoryChip } from '../shared/FailureCategoryChip';
import { RepairProposalCard } from '../shared/RepairProposalCard';
import { EvidenceGallery } from '../shared/EvidenceGallery';

interface RunDetailPageProps {
  runId: string;
  ownerId?: string;
  onBackToTest: (testId: string) => void;
  onRerunSuccess?: () => void;
}

export const RunDetailPage: React.FC<RunDetailPageProps> = ({
  runId,
  ownerId: ownerIdProp,
  onBackToTest,
  onRerunSuccess,
}) => {
  const { user } = useAuth();
  const ownerId = ownerIdProp || user?.id || 'user-demo-1406';
  const [run, setRun] = useState<TestRun | null>(null);
  const [artifacts, setArtifacts] = useState<EvidenceArtifact[]>([]);
  const [proposals, setProposals] = useState<RepairProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Manual proposal modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualReason, setManualReason] = useState('Selector updated to semantic role');
  const [manualConfidence, setManualConfidence] = useState(88);
  const [manualPlanJson, setManualPlanJson] = useState(
    JSON.stringify(
      {
        steps: [
          { action: 'click', target: { role: 'button', name: 'Place Order' }, value: null, timeout_ms: 3000 },
        ],
        required_assertions: [],
      },
      null,
      2
    )
  );
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRunData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [runData, artifactsData, proposalsData] = await Promise.all([
        apiFetch<TestRun>(`/runs/${runId}`, ownerId),
        apiFetch<EvidenceArtifact[]>(`/runs/${runId}/artifacts`, ownerId),
        apiFetch<RepairProposal[]>(`/runs/${runId}/repair-proposals`, ownerId),
      ]);
      setRun(runData);
      setArtifacts(artifactsData);
      setProposals(proposalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunData();
  }, [runId, ownerId]);

  // ── Supabase Realtime — auto-refresh when run row updates (e.g. Groq finishes analysis) ──
  useEffect(() => {
    const channel = supabase
      .channel(`run-realtime-${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'test_runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const updated = payload.new as TestRun;
          // Update run inline for instant feedback
          setRun((prev) => prev ? { ...prev, ...updated } : updated);
          // If analysis complete / proposal created, reload full data (proposals list)
          if (
            updated.status === 'repair_proposed' ||
            updated.status === 'passed' ||
            updated.status === 'failed' ||
            updated.status === 'needs_review'
          ) {
            loadRunData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const handleProposalApproved = () => {
    setToastMessage('✅ Repair approved! Test Version v2 created and verified.');
    loadRunData();
    if (onRerunSuccess) onRerunSuccess();
  };

  const handleCreateManualProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedPlan: ActionPlan;
    try {
      parsedPlan = JSON.parse(manualPlanJson);
    } catch {
      alert('Invalid JSON in Action Plan');
      return;
    }

    setIsSubmittingProposal(true);
    try {
      const newProp = await apiFetch<RepairProposal>(`/runs/${runId}/repair-proposals`, ownerId, {
        method: 'POST',
        body: JSON.stringify({
          reason: manualReason.trim(),
          // Backend expects 0–1 float; UI slider is 1–100
          confidence: normalizeConfidenceForAPI(manualConfidence),
          proposed_plan: parsedPlan,
        }),
      });

      setManualModalOpen(false);
      setProposals((prev) => [newProp, ...prev]);
      setToastMessage('Custom repair proposal added!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating proposal');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-pulse p-4">
        <div className="h-6 w-32 bg-surface-container rounded" />
        <div className="h-44 bg-surface-canvas rounded-2xl border border-border-subtle" />
        <div className="h-64 bg-surface-canvas rounded-2xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto my-12 text-center p-6 bg-surface-canvas rounded-2xl border border-border-subtle">
        <span className="material-symbols-outlined text-[36px] text-rose-500">error</span>
        <h2 className="text-base font-bold text-text-primary">Run Not Found</h2>
        <p className="text-xs text-text-secondary">{error || 'Unable to retrieve execution run details.'}</p>
        <button
          type="button"
          onClick={() => onBackToTest(run?.test_definition_id || 'test-checkout-flow')}
          className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
        >
          Back to Test
        </button>
      </div>
    );
  }

  const isFailed = run.status === 'failed' || run.status === 'environment_failed';
  const showRepairSection = isFailed || run.status === 'repair_proposed' || proposals.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80">
            ✕
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs pb-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => onBackToTest(run.test_definition_id)}
          className="text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Test Specification</span>
        </button>
        <span className="text-border-strong">/</span>
        <span className="font-semibold text-text-primary">Run #{run.run_number || 1} Detail</span>
      </div>

      {/* SECTION A — Run Overview */}
      <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-xs flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
              Execution Run #{run.run_number || 1}
            </h1>
            <RunStatusBadge status={run.status} size="lg" />
            {run.classification && <FailureCategoryChip category={run.classification} size="md" />}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
            <span>Duration: {run.duration || '8s'}</span>
            <span>•</span>
            <span>{new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Confidence bar & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {run.confidence != null && (
            <div className="md:col-span-4 p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">Diagnosis Confidence</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {normalizeConfidenceForDisplay(run.confidence)}% Confident
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${normalizeConfidenceForDisplay(run.confidence)}%` }}
                />
              </div>
              <span className="text-[11px] text-text-muted">
                Based on DOM tree diff and accessibility tree matching
              </span>
            </div>
          )}

          <div className={`${run.confidence != null ? 'md:col-span-8' : 'md:col-span-12'} flex flex-col gap-1`}>
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
              Execution Summary
            </span>
            <p className="text-sm font-medium text-text-primary leading-relaxed bg-surface-subtle/50 p-3.5 rounded-xl border border-border-subtle">
              {run.summary || 'Automated test pipeline executed in container environment.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION B — Evidence Gallery */}
      <EvidenceGallery artifacts={artifacts} />

      {/* SECTION C — Repair Panel (Conditional) */}
      {showRepairSection && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-text-primary">Self-Healing Repairs</h2>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                {proposals.length} Proposed
              </span>
            </div>

            {isFailed && (
              <button
                type="button"
                onClick={() => setManualModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-strong text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>+ Create Repair Proposal</span>
              </button>
            )}
          </div>

          {proposals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-canvas border border-border-subtle text-center text-xs text-text-muted flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">build_circle</span>
              <span>No repair proposals available yet. Click &quot;+ Create Repair Proposal&quot; to formulate one.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {proposals.map((prop) => (
                <RepairProposalCard
                  key={prop.id}
                  proposal={prop}
                  runId={run.id}
                  ownerId={ownerId}
                  onApproved={handleProposalApproved}
                  onValidated={loadRunData}
                  onRejected={() => {
                    setToastMessage('Repair proposal rejected.');
                    loadRunData();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Proposal Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="font-semibold text-base text-text-primary">Create Repair Proposal</h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualProposal} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Reason for Repair
                </label>
                <input
                  type="text"
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-text-primary">Confidence Score</span>
                  <span className="font-mono font-bold text-amber-500">{manualConfidence}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={manualConfidence}
                  onChange={(e) => setManualConfidence(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Proposed Action Plan (JSON)
                </label>
                <textarea
                  rows={5}
                  value={manualPlanJson}
                  onChange={(e) => setManualPlanJson(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] text-slate-200 border border-border-strong text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingProposal ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
