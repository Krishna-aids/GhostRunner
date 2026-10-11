import React, { useState, useEffect, useRef } from 'react';
import { TestDefinition, TestRun, RunStatus } from '../../types/domain';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { RunStatusBadge } from '../shared/RunStatusBadge';
import { FailureCategoryChip } from '../shared/FailureCategoryChip';
import { RunTimeline } from '../shared/RunTimeline';

interface TestDetailPageProps {
  testId: string;
  ownerId?: string;
  onBackToProject: (projectId: string) => void;
  onOpenRun: (runId: string) => void;
}

const TERMINAL_STATUSES: RunStatus[] = ['passed', 'failed', 'needs_review', 'environment_failed'];

export const TestDetailPage: React.FC<TestDetailPageProps> = ({
  testId,
  ownerId: ownerIdProp,
  onBackToProject,
  onOpenRun,
}) => {
  const { user } = useAuth();
  const ownerId = ownerIdProp || user?.id || 'user-demo-1406';
  const [test, setTest] = useState<TestDefinition | null>(null);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active run state
  const [activeRun, setActiveRun] = useState<TestRun | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timelineStatus, setTimelineStatus] = useState<RunStatus>('queued');
  const [pollingTimeAgo, setPollingTimeAgo] = useState<string>('Just now');

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadTestData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testData, runsData] = await Promise.all([
        apiFetch<TestDefinition>(`/tests/${testId}`, ownerId),
        apiFetch<TestRun[]>(`/tests/${testId}/runs`, ownerId),
      ]);
      setTest(testData);
      setRuns(runsData);

      // If most recent run was just triggered and not terminal, bind it
      if (runsData.length > 0 && !TERMINAL_STATUSES.includes(runsData[0].status)) {
        setActiveRun(runsData[0]);
        setTimelineStatus(runsData[0].status);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test definition');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestData();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, [testId, ownerId]);

  // Trigger Run Test
  const handleRunTest = async () => {
    setIsRunning(true);
    setTimelineStatus('queued');
    setPollingTimeAgo('Just now');

    try {
      const newRun = await apiFetch<TestRun>(`/tests/${testId}/runs`, ownerId, {
        method: 'POST',
        body: JSON.stringify({ environment_ref: 'demo-env', start_command: null }),
      });

      setActiveRun(newRun);
      setRuns((prev) => [newRun, ...prev.filter((r) => r.id !== newRun.id)]);

      // Check if this test is on version v2 (post-healing)
      const currentVer = test?.current_version?.version_number || 1;
      const isV2 = currentVer >= 2;

      // Simulate the exact stages: QUEUED -> PREPARING -> RUNNING -> COLLECTING_EVIDENCE -> CLASSIFYING -> FAILED (or PASSED if v2)
      const stages: RunStatus[] = [
        'queued',
        'preparing',
        'running',
        'collecting_evidence',
        'classifying',
        isV2 ? 'passed' : 'failed',
      ];

      let stepIndex = 0;
      stageTimerRef.current = setInterval(() => {
        stepIndex += 1;
        if (stepIndex < stages.length) {
          const nextStatus = stages[stepIndex];
          setTimelineStatus(nextStatus);
          setPollingTimeAgo(`${stepIndex * 2}s ago`);

          if (TERMINAL_STATUSES.includes(nextStatus)) {
            clearInterval(stageTimerRef.current!);
            setIsRunning(false);

            // Update active run object
            setActiveRun((prev) =>
              prev
                ? {
                    ...prev,
                    status: nextStatus,
                    classification: nextStatus === 'failed' ? 'LOCATOR_DRIFT' : null,
                    confidence: nextStatus === 'failed' ? 87 : 100,
                    summary:
                      nextStatus === 'failed'
                        ? 'Button selector .checkout-btn not found. Element moved.'
                        : 'Self-healed action plan validated: Test passed on v2 locators.',
                  }
                : null
            );

            // Refresh runs list
            apiFetch<TestRun[]>(`/tests/${testId}/runs`, ownerId).then((refreshed) => {
              setRuns(refreshed);
            });
          }
        }
      }, 1500);
    } catch (err) {
      setIsRunning(false);
      alert(err instanceof Error ? err.message : 'Failed to trigger test run');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-pulse p-4">
        <div className="h-6 w-32 bg-surface-container rounded" />
        <div className="h-40 bg-surface-canvas rounded-2xl border border-border-subtle" />
        <div className="h-64 bg-surface-canvas rounded-2xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto my-12 text-center p-6 bg-surface-canvas rounded-2xl border border-border-subtle">
        <span className="material-symbols-outlined text-[36px] text-rose-500">error</span>
        <h2 className="text-base font-bold text-text-primary">Test Not Found</h2>
        <p className="text-xs text-text-secondary">{error || 'Unable to retrieve test specification.'}</p>
        <button
          type="button"
          onClick={() => onBackToProject(test?.project_id || 'proj-ecom-checkout')}
          className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
        >
          Back to Project
        </button>
      </div>
    );
  }

  const versionNum = test.current_version?.version_number || 1;
  const isHealedV2 = versionNum >= 2;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs pb-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => onBackToProject(test.project_id)}
          className="text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Project</span>
        </button>
        <span className="text-border-strong">/</span>
        <span className="font-semibold text-text-primary truncate">{test.name}</span>
      </div>

      {/* TOP SECTION — Test Info & Big Run CTA */}
      <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              {test.name}
            </h1>
            <span
              className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isHealedV2
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-surface-muted text-text-secondary border-border-subtle'
              }`}
            >
              v{versionNum} {isHealedV2 ? '(Self-Healed)' : ''}
            </span>
          </div>

          <p className="font-body-md text-xs sm:text-sm text-text-secondary leading-relaxed">
            {test.original_intent}
          </p>

          <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted pt-1">
            <span>Assertions: {test.required_assertions.length} active</span>
            <span>•</span>
            <span>Environment: demo-env</span>
          </div>
        </div>

        {/* Big CTA ▶ Run Test */}
        <div className="shrink-0">
          <button
            type="button"
            disabled={isRunning}
            onClick={handleRunTest}
            className={`inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer ${
              isRunning
                ? 'bg-emerald-700/60 text-white/80 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/20 hover:scale-[1.02]'
            }`}
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Test...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                <span>▶ Run Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MIDDLE SECTION — Active Run Panel with Live Stepper */}
      {(activeRun || isRunning) && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-primary">Current Execution</span>
              <RunStatusBadge status={timelineStatus} size="sm" />
            </div>

            {activeRun && (
              <button
                type="button"
                onClick={() => onOpenRun(activeRun.id)}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Inspect Run #{activeRun.run_number || 1} Detail</span>
                <span className="font-mono">→</span>
              </button>
            )}
          </div>

          <RunTimeline currentStatus={timelineStatus} lastUpdated={pollingTimeAgo} />

          {/* If failed in live run, show instant link to AI Repair */}
          {timelineStatus === 'failed' && activeRun && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-[22px]">
                  auto_fix_high
                </span>
                <div className="flex flex-col">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Failure Detected: LOCATOR_DRIFT (87% confidence)
                  </span>
                  <span className="text-amber-800 dark:text-amber-300">
                    GhostRunner has formulated an AI repair proposal replacing brittle selectors with semantic roles.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenRun(activeRun.id)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold whitespace-nowrap shadow-xs cursor-pointer self-start sm:self-auto"
              >
                View Failure &amp; Approve Repair →
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM SECTION — Run History Table */}
      <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-text-primary">Run History</h3>
              <span className="text-[11px] text-text-muted">
                {runs.length} past automated test execution runs
              </span>
            </div>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted">
            No run history yet. Click &quot;▶ Run Test&quot; above to trigger your first execution.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted font-mono uppercase text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {runs.map((r, index) => {
                  const runNum = r.run_number || runs.length - index;
                  const dateStr = new Date(r.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onOpenRun(r.id)}
                      className="hover:bg-surface-subtle transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-text-primary">
                        #{runNum}
                      </td>
                      <td className="py-3 px-3 font-mono text-text-secondary whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3">
                        <RunStatusBadge status={r.status} size="sm" showPulse={false} />
                      </td>
                      <td className="py-3 px-3">
                        <FailureCategoryChip category={r.classification} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono text-text-muted">
                        {r.duration || '9s'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-primary font-semibold group-hover:underline">
                          View →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
