import React, { useState } from 'react';
import { HealingQueueItem } from '../types';

interface HealingQueueViewProps {
  items: HealingQueueItem[];
  onApproveItem: (id: string) => void;
  onRejectItem: (id: string) => void;
  onOpenTestRuns: () => void;
}

export const HealingQueueView: React.FC<HealingQueueViewProps> = ({
  items,
  onApproveItem,
  onRejectItem,
  onOpenTestRuns,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [testingItemId, setTestingItemId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [customSelector, setCustomSelector] = useState('');

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleTestInLiveDOM = (item: HealingQueueItem) => {
    setTestingItemId(item.id);
    setTestResult(null);

    setTimeout(() => {
      setTestingItemId(null);
      if (item.confidence >= 70) {
        setTestResult({
          id: item.id,
          success: true,
          message: `Staging DOM Match Verified: 1 matching element found for "${item.proposedSelector}" in 14ms.`,
        });
      } else {
        setTestResult({
          id: item.id,
          success: false,
          message: `Staging DOM Match Ambiguous: Found 2 matching elements for "${item.proposedSelector}". Refine selector to avoid strict mode violation.`,
        });
      }
    }, 1200);
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg text-text-primary">
              Self-Healing Queue
            </h1>
            <span className="inline-flex items-center px-space-sm py-0.5 rounded-full bg-status-warning-subtle text-status-warning border border-status-warning/30 font-code-sm text-code-sm font-semibold">
              {pendingCount} pending reviews
            </span>
          </div>
          <p className="font-body-md text-body-md text-text-secondary">
            Inspect autonomous DOM mutations, verify confidence scores, and push upstream pull requests to update test specs.
          </p>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-auto">
          <button
            onClick={onOpenTestRuns}
            className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-xl bg-surface-canvas shadow-sm text-text-primary hover:bg-surface-subtle transition-colors font-label-md text-label-md border border-border-subtle cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Test Runs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-xl">
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'pending', label: `Pending (${items.filter((i) => i.status === 'pending').length})` },
            { id: 'approved', label: `Approved (${items.filter((i) => i.status === 'approved').length})` },
            { id: 'rejected', label: `Rejected (${items.filter((i) => i.status === 'rejected').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-body-sm font-label-md transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-surface-canvas text-text-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-text-muted text-xs">
          <span className="w-2 h-2 rounded-full bg-status-healed"></span>
          <span>Safety Cutoff: 70% Confidence</span>
        </div>
      </div>

      {/* Queue Cards List */}
      <div className="flex flex-col gap-space-md">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-surface-canvas rounded-xl border border-border-subtle flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-status-healed">
              verified
            </span>
            <p className="font-headline-sm text-text-primary">No items in this queue filter</p>
            <p className="font-body-sm text-text-muted">
              All self-healing proposals have been triaged or no mutations recorded.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';
            const isTesting = testingItemId === item.id;
            const currentTestResult = testResult?.id === item.id ? testResult : null;

            return (
              <div
                key={item.id}
                className={`bg-surface-canvas rounded-xl border shadow-sm transition-all overflow-hidden ${
                  isApproved
                    ? 'border-status-success/40 bg-status-success-subtle/10'
                    : isRejected
                    ? 'border-status-failure/30 opacity-75'
                    : 'border-border-subtle hover:border-border-strong'
                }`}
              >
                {/* Header bar */}
                <div className="p-space-md bg-surface-subtle border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-space-sm flex-wrap">
                    <span className="font-code-md text-text-primary font-bold">
                      {item.specFile}:{item.line}
                    </span>
                    <span className="font-code-sm text-text-secondary bg-surface-container px-2 py-0.5 rounded">
                      {item.suite}
                    </span>
                    <span className="font-body-sm text-text-muted flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">alt_route</span>
                      {item.branch}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-body-sm text-text-muted text-xs">
                      {item.dateDiscovered}
                    </span>
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success font-label-sm font-semibold border border-status-success/30">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        PR Created #403
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-failure-subtle text-status-failure font-label-sm font-semibold border border-status-failure/30">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Rejected
                      </span>
                    )}
                    {!isApproved && !isRejected && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm font-semibold border ${
                          item.confidence >= 70
                            ? 'bg-status-healed-subtle text-status-healed border-status-healed/30'
                            : 'bg-status-warning-subtle text-status-warning border-status-warning/30'
                        }`}
                      >
                        {item.confidence}% Match Confidence
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-space-lg flex flex-col gap-space-md">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-md text-text-secondary text-xs uppercase tracking-wider">
                      Affected Test Scenario
                    </span>
                    <span className="font-headline-sm text-text-primary font-medium">
                      "{item.testName}"
                    </span>
                  </div>

                  {/* Diff Inspector Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {/* Broken */}
                    <div className="p-space-md rounded-xl bg-status-failure-subtle/50 border border-status-failure/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-status-failure font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          Broken In Code
                        </span>
                        <span className="font-code-sm text-text-muted">Line {item.line}</span>
                      </div>
                      <code className="font-code-sm text-status-failure bg-surface-canvas p-2 rounded-lg font-mono font-semibold break-all border border-status-failure/20">
                        {item.brokenSelector}
                      </code>
                    </div>

                    {/* Proposed */}
                    <div className="p-space-md rounded-xl bg-status-healed-subtle/50 border border-status-healed/20 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-status-healed font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                          Synthesized Locator ({item.confidence}% Match)
                        </span>
                        <span className="font-code-sm text-status-healed font-medium">
                          Used in {item.appliedRunsCount} successful runs
                        </span>
                      </div>
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customSelector}
                            onChange={(e) => setCustomSelector(e.target.value)}
                            className="flex-1 font-code-sm bg-surface-canvas p-2 rounded-lg border border-primary focus:outline-none"
                            placeholder="Enter custom selector..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              item.proposedSelector = customSelector;
                              setEditingItemId(null);
                            }}
                            className="px-2 py-1 bg-primary text-white rounded text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <code className="font-code-sm text-status-healed bg-surface-canvas p-2 rounded-lg font-mono font-semibold break-all border border-status-healed/20">
                          {item.proposedSelector}
                        </code>
                      )}
                    </div>
                  </div>

                  {/* AI Reasoning box */}
                  <div className="p-space-sm bg-surface-subtle rounded-lg border border-border-subtle flex items-start gap-2 text-body-sm text-text-secondary">
                    <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">
                      psychology
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-sm font-semibold text-text-primary">
                        Root-Cause & Structural Analysis:
                      </span>
                      <span>{item.reasoning}</span>
                    </div>
                  </div>

                  {/* Staging DOM Test Result feedback */}
                  {currentTestResult && (
                    <div
                      className={`p-2 rounded-lg text-body-sm flex items-center gap-2 ${
                        currentTestResult.success
                          ? 'bg-status-success-subtle text-status-success border border-status-success/30'
                          : 'bg-status-warning-subtle text-status-warning border border-status-warning/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {currentTestResult.success ? 'check_circle' : 'warning'}
                      </span>
                      <span>{currentTestResult.message}</span>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-space-sm pt-2 border-t border-border-subtle">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestInLiveDOM(item)}
                        disabled={isTesting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container text-text-primary text-xs font-label-md transition-colors border border-border-subtle cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isTesting ? 'sync' : 'network_check'}
                        </span>
                        <span>{isTesting ? 'Verifying in DOM...' : 'Verify on Staging DOM'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingItemId(item.id);
                          setCustomSelector(item.proposedSelector);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-label-md transition-colors border border-border-subtle cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        <span>Edit Selector</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isRejected && (
                        <button
                          type="button"
                          onClick={() => onRejectItem(item.id)}
                          className="px-3 py-1.5 rounded-lg text-status-failure hover:bg-status-failure-subtle text-xs font-label-md transition-colors cursor-pointer"
                        >
                          Reject Mutation
                        </button>
                      )}

                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => onApproveItem(item.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-status-healed text-on-primary hover:opacity-90 font-label-md text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">merge</span>
                          <span>Approve & Create PR</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
