/**
 * RunSuiteModal — Live Execution Panel
 *
 * Connects to the webhook server's SSE stream (/api/runs/:runId/stream)
 * and displays real-time log output, progress, and test status.
 *
 * Falls back to simulated test suite when no runId is provided or
 * the SSE connection fails (e.g. server not running).
 */
import React, { useState, useEffect, useRef } from 'react';

const API_BASE = (import.meta as any).env?.VITE_WEBHOOK_URL || 'http://localhost:4000';

interface RunSuiteModalProps {
  onClose: () => void;
  onComplete: () => void;
  /** Real Supabase run ID — if provided, connects to live SSE stream */
  runId?: string;
  /** Repo info for header display */
  repoFullName?: string;
  ref?: string;
}

interface TestWorker {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'healed' | 'warning';
  note: string;
  progress: number;
}

export const RunSuiteModal: React.FC<RunSuiteModalProps> = ({
  onClose,
  onComplete,
  runId,
  repoFullName,
  ref: branchRef,
}) => {
  const [isRunning, setIsRunning] = useState(true);
  const [overallProgress, setOverallProgress] = useState(5);
  const [logs, setLogs] = useState<string[]>([
    `[ghostrunner] Connecting to runner...`,
  ]);
  const [runStatus, setRunStatus] = useState<string>('queued');
  const [summary, setSummary] = useState<string>('');
  const [sseError, setSseError] = useState<string | null>(null);
  const [workers, setWorkers] = useState<TestWorker[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── Real SSE stream (when runId is provided) ─────────────────────────────
  useEffect(() => {
    if (!runId) {
      // No real run → fall back to simulated suite
      runSimulatedSuite();
      return;
    }

    const url = `${API_BASE}/api/runs/${runId}/stream`;
    console.log(`[RunSuiteModal] Connecting to SSE: ${url}`);

    let evtSource: EventSource;
    let connectionTimeout: ReturnType<typeof setTimeout>;

    try {
      evtSource = new EventSource(url);

      // Connection timeout — if no message in 10s, fall back to simulated suite
      connectionTimeout = setTimeout(() => {
        if (isRunning) {
          console.warn('[RunSuiteModal] SSE connection timeout — falling back to simulated suite');
          evtSource.close();
          setSseError('Runner offline or unreachable — running simulated test suite');
          runSimulatedSuite();
        }
      }, 10000);

      evtSource.onopen = () => {
        clearTimeout(connectionTimeout);
        addLog(`[ghostrunner] Connected to live runner (run: ${runId})`);
      };

      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as {
            type: string;
            line?: string;
            pct?: number;
            status?: string;
            summary?: string;
            framework?: string;
            error?: string;
            exitCode?: number;
          };

          switch (data.type) {
            case 'log':
              if (data.line) addLog(data.line);
              break;

            case 'progress':
              if (data.pct != null) setOverallProgress(data.pct);
              break;

            case 'status':
              if (data.status) {
                setRunStatus(data.status);
                addLog(`[ghostrunner] Status → ${data.status}`);
              }
              break;

            case 'framework':
              if (data.framework) {
                addLog(`[ghostrunner] Framework detected: ${data.framework}`);
                // Seed a single "worker" entry for the detected framework
                setWorkers([{
                  id: 'worker-1',
                  name: `${data.framework} test suite`,
                  status: 'running',
                  note: 'Running...',
                  progress: 30,
                }]);
              }
              break;

            case 'done':
              clearTimeout(connectionTimeout);
              evtSource.close();
              setIsRunning(false);
              setOverallProgress(100);
              setRunStatus(data.status || 'passed');
              setSummary(data.summary || '');
              if (data.summary) addLog(`[ghostrunner] ${data.summary}`);

              const passed = data.status === 'passed';
              setWorkers((prev) =>
                prev.map((w) => ({
                  ...w,
                  status: passed ? 'passed' : 'failed',
                  progress: 100,
                  note: data.summary || (passed ? 'Passed' : 'Failed'),
                }))
              );
              onComplete();
              break;
          }
        } catch {
          // Non-JSON SSE comment (heartbeat) — ignore
        }
      };

      evtSource.onerror = () => {
        clearTimeout(connectionTimeout);
        if (isRunning) {
          console.warn('[RunSuiteModal] SSE error — falling back to simulated suite');
          evtSource.close();
          setSseError('Could not reach runner server — running simulated test suite');
          runSimulatedSuite();
        }
      };
    } catch (err) {
      setSseError('EventSource not supported — running simulated test suite');
      runSimulatedSuite();
    }

    return () => {
      clearTimeout(connectionTimeout);
      evtSource?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  // ── Simulated execution (fallback) ────────────────────────────────────────────
  function runSimulatedSuite() {
    setWorkers([
      { id: 'run-1', name: 'test_checkout_flow.spec.ts', status: 'running', progress: 25, note: 'Step 1: Navigating to /checkout' },
      { id: 'run-2', name: 'test_auth_sso.spec.ts', status: 'running', progress: 35, note: 'Step 2: Submitting Okta SSO payload' },
      { id: 'run-3', name: 'test_inventory_modal.spec.ts', status: 'running', progress: 15, note: 'Step 1: Loading inventory grid' },
      { id: 'run-4', name: 'test_pricing_table.spec.ts', status: 'running', progress: 20, note: 'Step 1: Navigating to /pricing' },
    ]);
    setLogs([
      '[00:00.02] [runner] Spawning 4 Chromium worker threads on ubuntu-24.04...',
      '[00:00.08] [runner] Initializing GhostRunner neural locator resolver v2.4',
    ]);
    setOverallProgress(10);

    const t1 = setTimeout(() => {
      setOverallProgress(40);
      setLogs((prev) => [
        ...prev,
        '[00:01.20] [worker-2] test_auth_sso.spec.ts: OAuth 2.0 handshake completed (200 OK)',
        '[00:01.45] [worker-1] test_checkout_flow.spec.ts: Filled billing address input[name="address1"]',
      ]);
      setWorkers((prev) =>
        prev.map((t) => {
          if (t.id === 'run-2') return { ...t, progress: 80, note: 'Step 3: Verifying session cookies' };
          if (t.id === 'run-1') return { ...t, progress: 60, note: 'Step 3: Selected Payment Method' };
          if (t.id === 'run-4') return { ...t, progress: 50, note: 'Step 2: Toggle annual switch' };
          return t;
        })
      );
    }, 1200);

    const t2 = setTimeout(() => {
      setOverallProgress(70);
      setLogs((prev) => [
        ...prev,
        '[00:02.10] [worker-2] test_auth_sso.spec.ts: PASSED in 38s (0 interventions)',
        '[00:02.32] [worker-1] test_checkout_flow.spec.ts: [WARN] button#checkout-submit not found!',
        '[00:02.35] [worker-1] [ghostrunner] Autonomous Self-Healing activated! Matching accessibility tree...',
        '[00:02.38] [worker-1] [ghostrunner] Recovered: button[data-testid="place-order-cta"] (94% conf) in 32ms',
      ]);
      setWorkers((prev) =>
        prev.map((t) => {
          if (t.id === 'run-2') return { ...t, status: 'passed' as const, progress: 100, note: 'Passed (0 interventions)' };
          if (t.id === 'run-1') return { ...t, status: 'healed' as const, progress: 90, note: 'Auto-Healed: button[data-testid="place-order-cta"] (94%)' };
          if (t.id === 'run-4') return { ...t, status: 'healed' as const, progress: 85, note: 'Auto-Healed: button[aria-label="Contact Enterprise Sales"] (78%)' };
          if (t.id === 'run-3') return { ...t, status: 'warning' as const, progress: 75, note: 'Candidate matched at 64% (< 70% threshold)' };
          return t;
        })
      );
    }, 2400);

    const t3 = setTimeout(() => {
      setOverallProgress(100);
      setIsRunning(false);
      setRunStatus('passed');
      setSummary('3 Passed (2 Healed), 1 Failed — 75% Success Rate');
      setLogs((prev) => [
        ...prev,
        '[00:03.40] [worker-1] test_checkout_flow.spec.ts: PASSED via Self-Healing (1 issue resolved)',
        '[00:03.55] [worker-4] test_pricing_table.spec.ts: PASSED via Self-Healing (1 issue resolved)',
        '[00:03.70] [worker-3] test_inventory_modal.spec.ts: FAILED — Match confidence 64% below safety threshold',
        '[00:03.80] [runner] Suite finished: 3 Passed (2 Healed), 1 Failed. 75.0% Success Rate.',
      ]);
      setWorkers((prev) =>
        prev.map((t) => {
          if (t.id === 'run-1') return { ...t, status: 'passed' as const, progress: 100, note: 'Healed & Passed (94% conf)' };
          if (t.id === 'run-4') return { ...t, status: 'passed' as const, progress: 100, note: 'Healed & Passed (78% conf)' };
          if (t.id === 'run-3') return { ...t, status: 'failed' as const, progress: 100, note: 'Failed (Threshold safe-halt)' };
          return t;
        })
      );
      onComplete();
    }, 3800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }

  // ── Status color helper ──────────────────────────────────────────────────
  const statusColor = (s: string) => {
    switch (s) {
      case 'passed': return 'text-status-success';
      case 'failed': return 'text-status-failure';
      case 'healed': return 'text-status-warning animate-pulse';
      case 'warning': return 'text-status-warning';
      default: return 'text-primary animate-spin';
    }
  };
  const statusIcon = (s: string) => {
    switch (s) {
      case 'passed': return 'check_circle';
      case 'failed': return 'error';
      case 'healed': return 'auto_fix_high';
      case 'warning': return 'warning';
      default: return 'sync';
    }
  };
  const statusBadge = (s: string) => {
    switch (s) {
      case 'passed': return 'bg-status-success-subtle text-status-success';
      case 'failed': return 'bg-status-failure-subtle text-status-failure';
      case 'healed':
      case 'warning': return 'bg-status-warning-subtle text-status-warning';
      default: return 'bg-surface-container text-text-secondary';
    }
  };

  const headerTitle = repoFullName
    ? `${repoFullName}${branchRef ? ` @ ${branchRef}` : ''}`
    : 'checkout-suite • Staging • 4 Workers';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-3xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span
              className={`material-symbols-outlined text-[24px] ${
                isRunning ? 'text-primary animate-spin' : runStatus === 'passed' ? 'text-status-success' : 'text-status-failure'
              }`}
            >
              {isRunning ? 'sync' : runStatus === 'passed' ? 'check_circle' : 'error'}
            </span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-text-primary font-semibold">
                {isRunning ? 'Running Test Suite...' : `Suite ${runStatus === 'passed' ? 'Passed' : 'Completed'}`}
              </span>
              <span className="text-text-muted text-xs truncate max-w-xs">{headerTitle}</span>
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

        {/* SSE error banner */}
        {sseError && (
          <div className="px-space-lg py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>{sseError}</span>
          </div>
        )}

        {/* Live run ID badge */}
        {runId && !sseError && (
          <div className="px-space-lg py-1.5 bg-primary/5 border-b border-primary/10 text-[11px] font-mono text-primary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Live stream — run: {runId}
          </div>
        )}

        {/* Overall Progress Bar */}
        <div className="px-space-lg pt-space-md pb-space-sm flex flex-col gap-1.5 border-b border-border-subtle bg-surface-canvas">
          <div className="flex items-center justify-between text-xs font-label-md">
            <span className="text-text-secondary">
              {isRunning
                ? `${runStatus === 'preparing' ? 'Preparing environment...' : runStatus === 'running' ? 'Running tests...' : 'Processing...'}`
                : summary || 'Execution complete'}
            </span>
            <span className="font-code-sm text-primary font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                overallProgress === 100
                  ? runStatus === 'passed' ? 'bg-status-success' : 'bg-status-failure'
                  : 'bg-primary-container'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Worker Threads Status */}
        {workers.length > 0 && (
          <div className="p-space-lg flex flex-col gap-space-sm bg-surface-canvas">
            <span className="font-label-sm text-text-muted uppercase tracking-wider">
              {runId ? 'Test Execution' : 'Workers (Parallel)'}
            </span>
            <div className="space-y-2">
              {workers.map((t) => (
                <div
                  key={t.id}
                  className="p-space-sm rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className={`material-symbols-outlined text-[18px] ${statusColor(t.status)}`}>
                      {statusIcon(t.status)}
                    </span>
                    <span className="font-code-md text-text-primary font-medium text-sm">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-code-sm text-xs px-2 py-0.5 rounded ${statusBadge(t.status)}`}>
                      {t.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Log Stream */}
        <div className="p-space-lg bg-surface-muted border-t border-border-subtle flex flex-col gap-1">
          <span className="font-code-sm text-text-muted text-xs uppercase tracking-wider">
            Console Output
          </span>
          <div className="font-mono text-[11px] text-text-secondary space-y-1 max-h-44 overflow-y-auto bg-surface-canvas p-space-sm rounded-lg border border-border-subtle shadow-inner">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[ghostrunner]') || log.includes('PASSED via') || log.includes('Recovered')
                    ? 'text-emerald-500 font-semibold'
                    : log.includes('[WARN]') || log.includes('Auto-Healed')
                    ? 'text-amber-500'
                    : log.includes('FAILED') || log.includes('ERROR')
                    ? 'text-rose-500 font-semibold'
                    : log.includes('[stderr]')
                    ? 'text-orange-400'
                    : ''
                }
              >
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm bg-surface-subtle border-t border-border-subtle flex items-center justify-between gap-2">
          <span className="text-[11px] text-text-muted font-mono">
            {isRunning ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Running...
              </span>
            ) : (
              `Status: ${runStatus}`
            )}
          </span>
          {!isRunning && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-primary-container text-on-primary font-label-md text-xs font-semibold hover:opacity-95 cursor-pointer shadow-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
