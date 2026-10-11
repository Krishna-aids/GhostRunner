import React, { useState } from 'react';
import { TestRun } from '../types';

interface InvestigateModalProps {
  run: TestRun | null;
  onClose: () => void;
  onHealTest: (runId: string, healedSelector: string) => void;
}

export const InvestigateModal: React.FC<InvestigateModalProps> = ({
  run,
  onClose,
  onHealTest,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>(
    'button[data-action="bulk-edit"]'
  );
  const [testingInStaging, setTestingInStaging] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!run) return null;

  const candidates = [
    {
      selector: 'button[data-action="bulk-edit"]',
      score: 64,
      reason: 'Matched semantic action type and element tag in the batch toolbar container.',
      recommended: true,
    },
    {
      selector: 'button.inventory-batch-trigger',
      score: 58,
      reason: 'CSS class naming similarity found in parent inventory frame.',
      recommended: false,
    },
    {
      selector: 'div[role="toolbar"] > button:first-child',
      score: 49,
      reason: 'Positional ARIA role fallback.',
      recommended: false,
    },
  ];

  const handleTestInDOM = () => {
    setTestingInStaging(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingInStaging(false);
      setTestResult(
        'Verified on Staging DOM: Exactly 1 clickable element found for ' +
          selectedCandidate +
          '. Dispatched simulated click in 18ms.'
      );
    }, 1000);
  };

  const handleApprove = () => {
    onHealTest(run.id, selectedCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-500 text-[20px]">troubleshoot</span>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-text-primary">
                Failure Root-Cause Diagnostic
              </span>
              <span className="text-text-muted text-[11px] font-mono">
                {run.specFile} • Timeout & Threshold Violation
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-canvas transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Failure Summary Card */}
          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">error</span>
                Target Locator Missing in DOM
              </span>
              <span className="font-mono text-xs text-text-muted">Timeout: 3000ms</span>
            </div>
            <code className="font-mono text-xs text-rose-500 bg-surface-canvas p-2 rounded-lg break-all border border-border-subtle">
              button.bulk-actions-trigger
            </code>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
              Target element was removed during recent UI updates. Discovered candidate scored <strong>64%</strong>, which triggered threshold protection (required: <strong>70%</strong>).
            </p>
          </div>

          {/* Neural Candidates Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Candidate Replacements
            </span>
            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = selectedCandidate === cand.selector;
                return (
                  <div
                    key={cand.selector}
                    onClick={() => setSelectedCandidate(cand.selector)}
                    className={`p-space-md rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-primary bg-primary-container/5 ring-2 ring-primary/20'
                        : 'border-border-subtle hover:border-border-strong bg-surface-canvas'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="candidate"
                          checked={isSelected}
                          onChange={() => setSelectedCandidate(cand.selector)}
                          className="accent-primary"
                        />
                        <code className="font-code-sm text-text-primary font-bold">
                          {cand.selector}
                        </code>
                      </div>
                      <span
                        className={`font-code-sm text-xs px-2 py-0.5 rounded font-semibold ${
                          cand.score >= 60
                            ? 'bg-status-warning-subtle text-status-warning border border-status-warning/30'
                            : 'bg-surface-subtle text-text-muted border border-border-subtle'
                        }`}
                      >
                        {cand.score}% Similarity
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary pl-5">{cand.reason}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test in DOM Result */}
          {testResult && (
            <div className="p-space-sm rounded-lg bg-status-success-subtle text-status-success border border-status-success/30 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <button
            type="button"
            onClick={handleTestInDOM}
            disabled={testingInStaging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-canvas border border-border-strong text-text-primary text-xs font-label-md hover:bg-surface-container transition-colors cursor-pointer w-full sm:w-auto justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">
              {testingInStaging ? 'sync' : 'network_check'}
            </span>
            <span>{testingInStaging ? 'Testing against Staging...' : 'Live Test Selected in DOM'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary text-xs font-label-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-status-healed text-on-primary text-xs font-label-md font-semibold hover:opacity-90 shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              <span>Manual Override: Heal Test & Re-run</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
