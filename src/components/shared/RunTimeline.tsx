import React from 'react';
import { RunStatus } from '../../types/domain';

interface RunTimelineProps {
  currentStatus: RunStatus;
  lastUpdated?: string;
}

interface StepDef {
  key: RunStatus;
  label: string;
}

const PIPELINE_STEPS: StepDef[] = [
  { key: 'queued', label: 'QUEUED' },
  { key: 'preparing', label: 'PREPARING' },
  { key: 'running', label: 'RUNNING' },
  { key: 'collecting_evidence', label: 'COLLECTING EVIDENCE' },
  { key: 'classifying', label: 'CLASSIFYING' },
];

export const RunTimeline: React.FC<RunTimelineProps> = ({ currentStatus, lastUpdated = 'Just now' }) => {
  // Determine index of current status
  const getStepIndex = (status: RunStatus): number => {
    switch (status) {
      case 'queued':
        return 0;
      case 'preparing':
        return 1;
      case 'running':
      case 'rerunning':
        return 2;
      case 'collecting_evidence':
        return 3;
      case 'classifying':
        return 4;
      case 'repair_proposed':
      case 'failed':
      case 'passed':
      case 'needs_review':
      case 'environment_failed':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isTerminal = ['passed', 'failed', 'needs_review', 'environment_failed'].includes(currentStatus);

  return (
    <div className="w-full bg-surface-canvas rounded-2xl border border-border-subtle p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-text-primary uppercase tracking-wider">
            Execution Pipeline
          </span>
          {!isTerminal && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Live Polling
            </span>
          )}
        </div>
        <span className="text-[11px] text-text-muted font-mono">
          Last updated: {lastUpdated}
        </span>
      </div>

      {/* Stepper nodes */}
      <div className="relative flex items-center justify-between w-full pt-1 pb-2 overflow-x-auto">
        {PIPELINE_STEPS.map((step, idx) => {
          const isPassed = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isFuture = currentIndex < idx;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative group min-w-[100px]">
              {/* Connector line behind */}
              {idx < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors duration-300 ${
                    currentIndex > idx ? 'bg-emerald-500' : 'bg-border-subtle'
                  }`}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Step Node */}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isPassed
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 scale-110 shadow-sm'
                    : 'bg-surface-muted text-text-muted border border-border-strong'
                }`}
              >
                {isPassed ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-text-muted/40" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`mt-2 text-[10px] font-mono tracking-wider text-center ${
                  isPassed
                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                    : isCurrent
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-text-muted font-normal'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Final Terminal Stage Node */}
        <div className="flex flex-col items-center relative min-w-[100px]">
          <div
            className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              currentStatus === 'passed'
                ? 'bg-emerald-500 text-white shadow-xs'
                : currentStatus === 'failed' || currentStatus === 'environment_failed'
                ? 'bg-rose-500 text-white shadow-xs'
                : currentStatus === 'repair_proposed'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-surface-muted text-text-muted border border-border-strong'
            }`}
          >
            {currentStatus === 'passed' ? (
              <span className="material-symbols-outlined text-[16px]">verified</span>
            ) : currentStatus === 'failed' || currentStatus === 'environment_failed' ? (
              <span className="material-symbols-outlined text-[16px]">close</span>
            ) : currentStatus === 'repair_proposed' ? (
              <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-text-muted/40" />
            )}
          </div>
          <span
            className={`mt-2 text-[10px] font-mono tracking-wider text-center uppercase ${
              currentStatus === 'passed'
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : currentStatus === 'failed'
                ? 'text-rose-600 dark:text-rose-400 font-bold'
                : currentStatus === 'repair_proposed'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-text-muted font-normal'
            }`}
          >
            {currentStatus === 'repair_proposed' ? 'REPAIR READY' : isTerminal ? currentStatus : 'RESULT'}
          </span>
        </div>
      </div>
    </div>
  );
};
