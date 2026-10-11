import React, { useState } from 'react';
import { RepairProposal } from '../../types/domain';
import { apiFetch, normalizeConfidenceForDisplay } from '../../lib/api';

interface RepairProposalCardProps {
  proposal: RepairProposal;
  runId: string;
  ownerId: string;
  onApproved: () => void;
  onValidated?: () => void;
  onRejected?: () => void;
}

export const RepairProposalCard: React.FC<RepairProposalCardProps> = ({
  proposal,
  runId,
  ownerId,
  onApproved,
  onValidated,
  onRejected,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmReason, setConfirmReason] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleValidate = async () => {
    setIsValidating(true);
    setStatusMessage(null);
    try {
      await apiFetch(`/runs/${runId}/repair-proposals/${proposal.id}/validate`, ownerId, {
        method: 'POST',
      });
      setStatusMessage({ type: 'success', text: 'Validation passed! Selector resolved in DOM.' });
      if (onValidated) onValidated();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Validation failed',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmApprove = async () => {
    setIsApproving(true);
    setStatusMessage(null);
    try {
      await apiFetch(`/repair-proposals/${proposal.id}/approve`, ownerId, {
        method: 'POST',
        body: JSON.stringify({
          change_reason: confirmReason.trim() || 'Approved by user via GhostRunner UI',
        }),
      });
      setShowConfirmModal(false);
      setConfirmReason('');
      setStatusMessage({ type: 'success', text: '✅ Repair approved! Test version v2 created and validated.' });
      onApproved();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to approve repair proposal',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const isAlreadyApproved = proposal.validation_status === 'approved';

  return (
    <>
      <div className="bg-surface-canvas rounded-2xl border-2 border-amber-500/30 p-5 sm:p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
        {/* Subtle accent banner */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-text-primary">
                AI Self-Healing Repair Proposal
              </span>
              <span className="text-[11px] text-text-muted">
                Proposed Action Plan • Created {new Date(proposal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
              {normalizeConfidenceForDisplay(proposal.confidence)}% Confidence
            </span>
            <span
              className={`font-mono text-xs px-2.5 py-1 rounded-lg border uppercase font-medium ${
                proposal.validation_status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : proposal.validation_status === 'validated_pass'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                  : 'bg-surface-muted text-text-secondary border-border-subtle'
              }`}
            >
              {proposal.validation_status}
            </span>
          </div>
        </div>

        {/* Reason explanation */}
        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs flex items-start gap-2.5 text-text-primary">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px] shrink-0 mt-0.5">
            lightbulb
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-amber-900 dark:text-amber-200">Root Cause & Healing Rationale:</span>
            <p className="text-text-secondary leading-relaxed">{proposal.reason}</p>
          </div>
        </div>

        {/* Proposed Plan Code Block */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-medium font-mono text-[11px] uppercase tracking-wider">
              Proposed Action Plan (JSON)
            </span>
            <span className="text-[10px] text-text-muted">
              {proposal.proposed_plan.steps.length} steps configured
            </span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-border-subtle bg-[#0a0a0a] text-slate-200 p-4 font-mono text-xs max-h-56 overflow-y-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(proposal.proposed_plan, null, 2)}
            </pre>
          </div>
        </div>

        {/* Status Toast/Banner */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {statusMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <span className="text-xs text-text-muted">
            {isAlreadyApproved
              ? '✅ This repair was approved and applied to Test Version v2.'
              : 'Approving this proposal automatically creates Version v2 and re-runs validation.'}
          </span>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!isAlreadyApproved && (
              <>
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="px-3.5 py-1.5 rounded-xl border border-border-strong text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-all cursor-pointer disabled:opacity-50"
                >
                  {isValidating ? 'Validating...' : 'Validate Repair'}
                </button>

                {onRejected && (
                  <button
                    type="button"
                    onClick={onRejected}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  <span>Approve Repair</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">auto_fix_high</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold text-base text-text-primary">Approve Self-Healing Repair?</h3>
                <span className="text-xs text-text-muted">Create Test Version v2</span>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Are you sure you want to approve this repair? This will automatically create a new test version (<strong>v2</strong>) with the healed semantic selector and immediately trigger a validation re-run.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-primary">Reason for Approval</label>
              <textarea
                rows={2}
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="e.g. Verified selector matches semantic role in staging environment"
                className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary transition-all font-body-md resize-none"
              />
              <span className="text-[10px] text-text-muted">Optional — defaults to &quot;Approved by user via GhostRunner UI&quot;</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {isApproving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>Confirm &amp; Create v2</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
