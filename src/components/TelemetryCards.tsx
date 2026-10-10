import React from 'react';
import { MetricSummary } from '../types';

interface TelemetryCardsProps {
  metrics: MetricSummary;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
      {/* 1. Success Rate Card */}
      <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm border border-border-subtle/50 flex flex-col justify-between hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between text-text-secondary font-label-sm text-label-sm uppercase tracking-wider">
          <span>Success Rate</span>
          <span className="material-symbols-outlined text-status-success text-[18px]">
            check_circle
          </span>
        </div>
        <div className="mt-space-sm flex items-baseline justify-between">
          <span className="font-display-hero text-display-hero text-text-primary font-bold">
            {metrics.successRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-sm overflow-hidden">
          <div
            className="bg-status-success h-full transition-all duration-500"
            style={{ width: `${metrics.successRate}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Self-Healed Selectors Card */}
      <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm border border-border-subtle/50 flex flex-col justify-between hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between text-text-secondary font-label-sm text-label-sm uppercase tracking-wider">
          <span>Self-Healed Selectors</span>
          <span className="material-symbols-outlined text-status-healed text-[18px]">
            auto_fix_high
          </span>
        </div>
        <div className="mt-space-sm flex items-baseline justify-between">
          <span className="font-display-hero text-display-hero text-text-primary font-bold">
            {metrics.selfHealedCount}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-sm overflow-hidden">
          <div
            className="bg-status-healed h-full transition-all duration-500"
            style={{ width: `${metrics.avgConfidence}%` }}
          ></div>
        </div>
      </div>

      {/* 3. Total Duration Card */}
      <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm border border-border-subtle/50 flex flex-col justify-between hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between text-text-secondary font-label-sm text-label-sm uppercase tracking-wider">
          <span>Total Duration</span>
          <span className="material-symbols-outlined text-text-muted text-[18px]">
            schedule
          </span>
        </div>
        <div className="mt-space-sm flex items-baseline justify-between">
          <span className="font-display-hero text-display-hero text-text-primary font-bold">
            {metrics.totalDuration}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-sm overflow-hidden">
          <div className="bg-primary-container h-full w-[45%] transition-all duration-500"></div>
        </div>
      </div>

      {/* 4. Failing Locators Card */}
      <div className="bg-surface-canvas rounded-xl p-space-md shadow-sm border border-border-subtle/50 flex flex-col justify-between hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between text-text-secondary font-label-sm text-label-sm uppercase tracking-wider">
          <span>Failing Locators</span>
          <span className="material-symbols-outlined text-status-failure text-[18px]">
            error
          </span>
        </div>
        <div className="mt-space-sm flex items-baseline justify-between">
          <span className="font-display-hero text-display-hero text-text-primary font-bold">
            {metrics.failingCount}
          </span>
        </div>
        <div className="w-full bg-surface-container rounded-full h-1.5 mt-space-sm overflow-hidden">
          <div className="bg-status-failure h-full w-[25%] transition-all duration-500"></div>
        </div>
      </div>
    </div>
  );
};
