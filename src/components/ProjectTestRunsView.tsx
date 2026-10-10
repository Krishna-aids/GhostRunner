import React from 'react';
import { GitHubProject, TestRun, MetricSummary } from '../types';
import { TelemetryCards } from './TelemetryCards';
import { TestRunsTable } from './TestRunsTable';

interface ProjectTestRunsViewProps {
  project: GitHubProject;
  onBackToProjects: () => void;
  onRunSuite: () => void;
  onExportReport: () => void;
  onRerunTest: (runId: string) => void;
  onOpenTrace: (run: TestRun) => void;
  onViewInHealingQueue: (spec: string) => void;
  onInvestigate: (run: TestRun) => void;
  metrics: MetricSummary;
}

export const ProjectTestRunsView: React.FC<ProjectTestRunsViewProps> = ({
  project,
  onBackToProjects,
  onRunSuite,
  onExportReport,
  onRerunTest,
  onOpenTrace,
  onViewInHealingQueue,
  onInvestigate,
  metrics,
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full text-xs text-[#ededed]">
      {/* Breadcrumb & Project Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1f1f1f]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onBackToProjects}
              className="text-[#888888] hover:text-[#ededed] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">arrow_back</span>
              <span>Projects</span>
            </button>
            <span className="text-[#444444]">/</span>
            <span className="font-semibold text-[#ededed]">{project.name}</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161616] text-[#00df72] border border-[#00df72]/20 font-semibold">
              Self-Healing Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#888888] flex-wrap">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#666666]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>{project.repo}</span>
            </span>
            <span>•</span>
            <span className="font-mono">{project.branch}</span>
            <span>•</span>
            <span>Framework: {project.framework}</span>
            <span>•</span>
            <span className="text-[#00df72] font-medium">{project.healingRate} Healing Rate</span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-xs font-medium text-[#ededed] hover:bg-[#161616] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-[#888888]">download</span>
            <span>Export Report (JUnit / JSON)</span>
          </button>

          <button
            type="button"
            onClick={onRunSuite}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#ffffff] text-[#000000] font-semibold text-xs hover:bg-[#eaeaea] transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Run Self-Healing Suite</span>
          </button>
        </div>
      </div>

      {/* Telemetry Cards Strip */}
      <TelemetryCards metrics={metrics} />

      {/* Test Runs Inspector Table */}
      <TestRunsTable
        testRuns={project.testRuns}
        onRerunTest={onRerunTest}
        onOpenTrace={onOpenTrace}
        onViewInHealingQueue={onViewInHealingQueue}
        onInvestigate={onInvestigate}
        selectedEnv="Production / Staging"
      />
    </div>
  );
};
