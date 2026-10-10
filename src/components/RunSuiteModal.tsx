import React, { useState, useEffect } from 'react';
import { TestRun } from '../types';

interface RunSuiteModalProps {
  onClose: () => void;
  onComplete: () => void;
  initialRunId?: string;
}

export const RunSuiteModal: React.FC<RunSuiteModalProps> = ({
  onClose,
  onComplete,
  initialRunId,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [overallProgress, setOverallProgress] = useState(10);
  const [logs, setLogs] = useState<string[]>([
    '[00:00.02] [runner] Spawning 4 Chromium worker threads on ubuntu-24.04...',
    '[00:00.08] [runner] Initializing GhostRunner neural locator resolver v2.4',
  ]);

  const [testStates, setTestStates] = useState([
    {
      id: 'run-1',
      name: 'test_checkout_flow.spec.ts',
      status: 'running',
      progress: 25,
      note: 'Step 1: Navigating to /checkout',
    },
    {
      id: 'run-2',
      name: 'test_auth_sso.spec.ts',
      status: 'running',
      progress: 35,
      note: 'Step 2: Submitting Okta SSO payload',
    },
    {
      id: 'run-3',
      name: 'test_inventory_modal.spec.ts',
      status: 'running',
      progress: 15,
      note: 'Step 1: Loading inventory grid',
    },
    {
      id: 'run-4',
      name: 'test_pricing_table.spec.ts',
      status: 'running',
      progress: 20,
      note: 'Step 1: Navigating to /pricing',
    },
  ]);

  useEffect(() => {
    // Stage 1: ~1.2s in
    const t1 = setTimeout(() => {
      setOverallProgress(40);
      setLogs((prev) => [
        ...prev,
        '[00:01.20] [worker-2] test_auth_sso.spec.ts: OAuth 2.0 handshake completed (200 OK)',
        '[00:01.45] [worker-1] test_checkout_flow.spec.ts: Filled billing address input[name="address1"]',
      ]);
      setTestStates((prev) =>
        prev.map((t) => {
          if (t.id === 'run-2') return { ...t, progress: 80, note: 'Step 3: Verifying session cookies' };
          if (t.id === 'run-1') return { ...t, progress: 60, note: 'Step 3: Selected Payment Method' };
          if (t.id === 'run-4') return { ...t, progress: 50, note: 'Step 2: Toggle annual switch' };
          return t;
        })
      );
    }, 1200);

    // Stage 2: ~2.4s in (Self-Healing Intervention Triggered!)
    const t2 = setTimeout(() => {
      setOverallProgress(70);
      setLogs((prev) => [
        ...prev,
        '[00:02.10] [worker-2] test_auth_sso.spec.ts: PASSED in 38s (0 interventions)',
        '[00:02.32] [worker-1] test_checkout_flow.spec.ts: [WARN] button#checkout-submit not found!',
        '[00:02.35] [worker-1] [ghostrunner] Autonomous Self-Healing activated! Matching accessibility tree...',
        '[00:02.38] [worker-1] [ghostrunner] Recovered target: button[data-testid="place-order-cta"] (94% conf) in 32ms!',
      ]);
      setTestStates((prev) =>
        prev.map((t) => {
          if (t.id === 'run-2') return { ...t, status: 'passed', progress: 100, note: 'Passed (0 interventions)' };
          if (t.id === 'run-1')
            return {
              ...t,
              status: 'healed',
              progress: 90,
              note: 'Auto-Healed: button[data-testid="place-order-cta"] (94%)',
            };
          if (t.id === 'run-4')
            return {
              ...t,
              status: 'healed',
              progress: 85,
              note: 'Auto-Healed: button[aria-label="Contact Enterprise Sales"] (78%)',
            };
          if (t.id === 'run-3')
            return {
              ...t,
              status: 'warning',
              progress: 75,
              note: 'Candidate matched at 64% (< 70% threshold)',
            };
          return t;
        })
      );
    }, 2400);

    // Stage 3: ~3.8s in (Completed)
    const t3 = setTimeout(() => {
      setOverallProgress(100);
      setIsRunning(false);
      setLogs((prev) => [
        ...prev,
        '[00:03.40] [worker-1] test_checkout_flow.spec.ts: PASSED via Self-Healing (1 issue resolved)',
        '[00:03.55] [worker-4] test_pricing_table.spec.ts: PASSED via Self-Healing (1 issue resolved)',
        '[00:03.70] [worker-3] test_inventory_modal.spec.ts: FAILED - Match confidence 64% below safety threshold 70%',
        '[00:03.80] [runner] Suite execution finished: 3 Passed (2 Healed), 1 Failed. 75.0% Success Rate.',
      ]);
      setTestStates((prev) =>
        prev.map((t) => {
          if (t.id === 'run-1') return { ...t, status: 'passed', progress: 100, note: 'Healed & Passed (94% conf)' };
          if (t.id === 'run-4') return { ...t, status: 'passed', progress: 100, note: 'Healed & Passed (78% conf)' };
          if (t.id === 'run-3') return { ...t, status: 'failed', progress: 100, note: 'Failed (Threshold safe-halt)' };
          return t;
        })
      );
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span
              className={`material-symbols-outlined text-[24px] ${
                isRunning ? 'text-primary animate-spin' : 'text-status-success'
              }`}
            >
              {isRunning ? 'sync' : 'check_circle'}
            </span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-text-primary font-semibold">
                {isRunning ? 'Executing Parallel Test Suite...' : 'Suite Execution Completed'}
              </span>
              <span className="text-text-muted text-xs">
                Acme Web App / checkout-suite • Staging v2.18 • 4 Worker Threads
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="px-space-lg pt-space-md pb-space-sm flex flex-col gap-1.5 border-b border-border-subtle bg-surface-canvas">
          <div className="flex items-center justify-between text-xs font-label-md">
            <span className="text-text-secondary">
              {isRunning ? 'Running automated assertions & locator resolvers...' : 'Execution Summary: 75% Pass Rate'}
            </span>
            <span className="font-code-sm text-primary font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                overallProgress === 100 ? 'bg-status-success' : 'bg-primary-container'
              }`}
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Worker Threads Status */}
        <div className="p-space-lg flex flex-col gap-space-sm bg-surface-canvas">
          <span className="font-label-sm text-text-muted uppercase tracking-wider">
            Worker Threads (Parallel Execution)
          </span>

          <div className="space-y-2">
            {testStates.map((t) => (
              <div
                key={t.id}
                className="p-space-sm rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-space-sm">
                  {t.status === 'passed' ? (
                    <span className="material-symbols-outlined text-status-success text-[18px]">
                      check_circle
                    </span>
                  ) : t.status === 'failed' ? (
                    <span className="material-symbols-outlined text-status-failure text-[18px]">
                      error
                    </span>
                  ) : t.status === 'healed' ? (
                    <span className="material-symbols-outlined text-status-warning text-[18px] animate-pulse">
                      auto_fix_high
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-primary text-[18px] animate-spin">
                      sync
                    </span>
                  )}
                  <span className="font-code-md text-text-primary font-medium">{t.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-code-sm text-xs px-2 py-0.5 rounded ${
                      t.status === 'passed'
                        ? 'bg-status-success-subtle text-status-success'
                        : t.status === 'failed'
                        ? 'bg-status-failure-subtle text-status-failure'
                        : t.status === 'healed'
                        ? 'bg-status-warning-subtle text-status-warning'
                        : 'bg-surface-container text-text-secondary'
                    }`}
                  >
                    {t.note}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Log Stream */}
        <div className="p-space-lg bg-surface-muted border-t border-border-subtle flex flex-col gap-1">
          <span className="font-code-sm text-text-muted text-xs uppercase tracking-wider">
            Live Execution Stream
          </span>
          <div className="font-mono text-[11px] text-text-secondary space-y-1 max-h-36 overflow-y-auto bg-surface-canvas p-space-sm rounded-lg border border-border-subtle shadow-inner">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[ghostrunner]') || log.includes('PASSED via')
                    ? 'text-status-healed font-semibold'
                    : log.includes('[WARN]')
                    ? 'text-status-warning'
                    : log.includes('FAILED')
                    ? 'text-status-failure font-semibold'
                    : ''
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm bg-surface-subtle border-t border-border-subtle flex items-center justify-end gap-2">
          {!isRunning && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-primary-container text-on-primary font-label-md text-xs font-semibold hover:opacity-95 cursor-pointer shadow-xs"
            >
              Done & Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
