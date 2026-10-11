import React from 'react';
import { MetricSummary } from '../types';

interface TelemetryCardsProps {
  metrics: MetricSummary;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Pass Rate Card */}
      <div className="bg-surface-canvas rounded-xl p-4 shadow-xs border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted text-[11px] font-medium uppercase tracking-wider">
          <span>Pass Rate</span>
          <span className="material-symbols-outlined text-status-success text-[17px]">
            check_circle
          </span>
        </div>
        <div className="my-2.5 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {metrics.successRate.toFixed(1)}%
          </span>
          <span className="text-[11px] text-status-success font-medium">
            +{metrics.healsBoost.toFixed(0)}% boost
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
          <div
            className="bg-status-success h-full transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.successRate)}%` }}
          />
        </div>
      </div>

      {/* 2. Self-Healed Selectors Card */}
      <div className="bg-surface-canvas rounded-xl p-4 shadow-xs border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted text-[11px] font-medium uppercase tracking-wider">
          <span>Self-Healed Selectors</span>
          <span className="material-symbols-outlined text-status-healed text-[17px]">
            auto_fix_high
          </span>
        </div>
        <div className="my-2.5 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {metrics.selfHealedCount}
          </span>
          <span className="text-[11px] text-text-muted font-medium">
            {metrics.avgConfidence}% avg match
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
          <div
            className="bg-status-healed h-full transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.avgConfidence)}%` }}
          />
        </div>
      </div>

      {/* 3. Total Duration Card */}
      <div className="bg-surface-canvas rounded-xl p-4 shadow-xs border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted text-[11px] font-medium uppercase tracking-wider">
          <span>Total Duration</span>
          <span className="material-symbols-outlined text-text-muted text-[17px]">
            schedule
          </span>
        </div>
        <div className="my-2.5 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {metrics.totalDuration}
          </span>
          <span className="text-[11px] text-text-muted font-medium">
            {metrics.threads} workers
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
          <div className="bg-primary h-full w-[45%] transition-all duration-500" />
        </div>
      </div>

      {/* 4. Failing Locators Card */}
      <div className="bg-surface-canvas rounded-xl p-4 shadow-xs border border-border-subtle hover:border-border-strong transition-all flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted text-[11px] font-medium uppercase tracking-wider">
          <span>Failing Tests</span>
          <span className="material-symbols-outlined text-status-failure text-[17px]">
            error
          </span>
        </div>
        <div className="my-2.5 flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            {metrics.failingCount}
          </span>
          <span className="text-[11px] text-status-failure font-medium">
            {metrics.failingCount === 0 ? 'All passing' : 'Needs review'}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              metrics.failingCount > 0 ? 'bg-status-failure w-[25%]' : 'bg-status-success w-full'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
