import React from 'react';
import { RunStatus } from '../../types/domain';

interface RunStatusBadgeProps {
  status: RunStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const RunStatusBadge: React.FC<RunStatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = true,
}) => {
  const getStatusConfig = (s: RunStatus) => {
    switch (s) {
      case 'queued':
        return {
          label: 'QUEUED',
          icon: 'schedule',
          classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          dot: 'bg-slate-400',
          pulse: false,
        };
      case 'preparing':
        return {
          label: 'PREPARING',
          icon: 'build',
          classes: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
          dot: 'bg-blue-500',
          pulse: true,
        };
      case 'running':
        return {
          label: 'RUNNING',
          icon: 'sync',
          classes: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
          dot: 'bg-blue-500',
          pulse: true,
        };
      case 'collecting_evidence':
        return {
          label: 'COLLECTING EVIDENCE',
          icon: 'find_in_page',
          classes: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
          dot: 'bg-indigo-500',
          pulse: true,
        };
      case 'classifying':
        return {
          label: 'CLASSIFYING',
          icon: 'psychology',
          classes: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
          dot: 'bg-purple-500',
          pulse: true,
        };
      case 'repair_proposed':
        return {
          label: 'REPAIR PROPOSED',
          icon: 'auto_fix_high',
          classes: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500',
          pulse: false,
        };
      case 'rerunning':
        return {
          label: 'RERUNNING',
          icon: 'replay',
          classes: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
          dot: 'bg-blue-500',
          pulse: true,
        };
      case 'passed':
        return {
          label: 'PASSED',
          icon: 'check_circle',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          pulse: false,
        };
      case 'failed':
        return {
          label: 'FAILED',
          icon: 'cancel',
          classes: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500',
          pulse: false,
        };
      case 'needs_review':
        return {
          label: 'NEEDS REVIEW',
          icon: 'warning',
          classes: 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
          dot: 'bg-orange-500',
          pulse: false,
        };
      case 'environment_failed':
        return {
          label: 'ENV FAILED',
          icon: 'error',
          classes: 'bg-red-100 text-red-900 border-red-400 dark:bg-red-950 dark:text-red-200 dark:border-red-900',
          dot: 'bg-red-700',
          pulse: false,
        };
      default:
        return {
          label: String(status).toUpperCase(),
          icon: 'help',
          classes: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
          dot: 'bg-slate-400',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  const iconSizes = {
    sm: 'text-[12px]',
    md: 'text-[15px]',
    lg: 'text-[18px]',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border font-mono font-medium tracking-wide ${sizeClasses} ${config.classes}`}
    >
      {showPulse && config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
      )}
      {!config.pulse && (
        <span className={`material-symbols-outlined ${iconSizes} shrink-0`}>
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
};
