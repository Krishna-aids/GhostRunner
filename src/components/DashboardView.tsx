import React from 'react';
import { MetricSummary } from '../types';

interface DashboardViewProps {
  metrics: MetricSummary;
  onOpenRuns: () => void;
  onOpenHealingQueue: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onOpenRuns,
  onOpenHealingQueue,
}) => {
  return (
    <div className="flex flex-col gap-space-lg">
      {/* Page Title & Actions Row: Perfectly aligned on same horizontal axis */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Automation Health Dashboard
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-status-success-subtle text-status-success border border-status-success/30 text-xs font-semibold">
              Live Telemetry
            </span>
          </div>

          <button
            onClick={onOpenRuns}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>View All Runs</span>
          </button>
        </div>

        <p className="font-body-md text-sm text-text-secondary max-w-3xl">
          Continuous flakiness elimination, self-healing pipeline metrics, and locator degradation trends.
        </p>
      </div>

      {/* Hero ROI Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-status-healed/10 to-surface-canvas rounded-2xl p-space-lg border border-border-subtle shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg">
        <div className="flex items-start gap-space-md max-w-2xl">
          <div className="p-3 rounded-xl bg-status-healed text-on-primary shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">trending_up</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-headline-md text-text-primary">
              14.2 Engineering Hours Preserved This Sprint
            </span>
            <p className="font-body-md text-text-secondary">
              GhostRunner autonomously recovered 6 blocked PR builds that would have halted CI pipelines.
              Current locator resilience score is <span className="font-semibold text-status-healed">94.8%</span>.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenHealingQueue}
          className="px-4 py-2 rounded-xl bg-surface-canvas border border-border-strong text-text-primary text-sm font-semibold hover:bg-surface-subtle transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          Review 3 Open Heals ➔
        </button>
      </div>

      {/* Grid of Analytical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        {/* Pass Rate Contrast */}
        <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Autonomous Delta
            </span>
            <span className="material-symbols-outlined text-primary text-[20px]">insights</span>
          </div>
          <div className="my-4 flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-secondary">With Self-Healing</span>
              <span className="font-bold text-lg text-status-success">75.0%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div className="bg-status-success h-full w-[75%]"></div>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm text-text-secondary">Raw Legacy Playwright</span>
              <span className="font-bold text-lg text-status-failure">50.0%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
              <div className="bg-status-failure h-full w-[50%]"></div>
            </div>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            +25.0% net improvement in CI pipeline velocity
          </span>
        </div>

        {/* Worker Performance */}
        <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Parallel Execution
            </span>
            <span className="material-symbols-outlined text-text-secondary text-[20px]">memory</span>
          </div>
          <div className="my-4 flex flex-col gap-1">
            <span className="font-display-hero text-display-hero text-text-primary font-bold">
              4 Threads
            </span>
            <span className="text-body-sm text-text-secondary">
              Chromium Headless Cluster on Ubuntu 24.04
            </span>
            {/* Thread Segments */}
            <div className="flex items-center gap-1 mt-2">
              <span className="h-2 flex-1 rounded bg-status-success" title="Thread 1: Healthy Passing"></span>
              <span className="h-2 flex-1 rounded bg-status-success" title="Thread 2: Healthy Passing"></span>
              <span className="h-2 flex-1 rounded bg-status-healed" title="Thread 3: Autonomous Healing Active"></span>
              <span className="h-2 flex-1 rounded bg-status-warning" title="Thread 4: Active Timeout Intercept"></span>
            </div>
            {/* Thread States Legend */}
            <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1.5 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-success"></span>
                <span>Passing (2)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-healed"></span>
                <span>Healed (1)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-status-warning"></span>
                <span>Intercepting (1)</span>
              </span>
            </div>
          </div>
          <span className="text-xs text-status-healed font-medium">
            Intervention overhead: ~32ms avg
          </span>
        </div>

        {/* Flakiness Index */}
        <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              Flakiness Index
            </span>
            <span className="material-symbols-outlined text-status-healed text-[20px]">verified</span>
          </div>
          <div className="my-4 flex flex-col gap-1">
            <span className="font-display-hero text-display-hero text-text-primary font-bold">
              0.8%
            </span>
            <span className="text-body-sm text-text-secondary">
              Down from 14.6% before dynamic locator matching
            </span>
          </div>
          <span className="text-xs text-text-secondary font-medium">
            Zero false-positive merges across 128 recorded runs
          </span>
        </div>
      </div>

      {/* Component Volatility Breakdown */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col gap-space-md">
        {/* Header: Standardized with icon on the right matching metric cards */}
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-text-primary font-semibold">
              UI Component Mutation Hotspots
            </span>
            <span className="text-xs text-text-muted">(Last 30 Days)</span>
          </div>
          <span className="material-symbols-outlined text-primary text-[20px]">layers</span>
        </div>

        <div className="space-y-3">
          {[
            { component: 'Checkout Flow CTA Buttons', rate: 42, heals: 8, status: 'High Volatility' },
            { component: 'Pricing Matrix Cards & Toggles', rate: 28, heals: 5, status: 'Moderate' },
            { component: 'Inventory Modal Bulk Actions', rate: 18, heals: 3, status: 'Needs Review' },
            { component: 'Auth & SSO Identity Gateway', rate: 6, heals: 1, status: 'Stable' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-body-sm">
                <span className="font-medium text-text-primary">{item.component}</span>
                <span className="font-code-sm text-text-secondary">
                  {item.heals} heals ({item.rate}%)
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full ${
                    item.rate > 35
                      ? 'bg-status-warning'
                      : item.rate > 20
                      ? 'bg-primary'
                      : 'bg-status-healed'
                  }`}
                  style={{ width: `${item.rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
