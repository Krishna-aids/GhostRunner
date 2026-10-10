import React, { useState } from 'react';
import { GitHubProject } from '../types';

interface ProjectsOverviewProps {
  projects: GitHubProject[];
  onSelectProject: (project: GitHubProject) => void;
  onOpenImportModal: () => void;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({
  projects,
  onSelectProject,
  onOpenImportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddNewMenu, setShowAddNewMenu] = useState(false);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full text-xs text-[#ededed]">
      {/* Top Search & Filter Bar matching screenshot */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search input with / shortcut */}
        <div className="relative flex-1 max-w-xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#666666]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Projects"
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#333333] transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono text-[#666666] bg-[#141414] px-1.5 py-0.5 rounded border border-[#222222]">
            /
          </span>
        </div>

        {/* View toggles & Add New button */}
        <div className="flex items-center gap-2">
          {/* Filter options */}
          <button
            type="button"
            className="p-1.5 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] text-[#888888] hover:text-[#ededed] hover:border-[#333333] transition-colors cursor-pointer"
            title="Filter settings"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
          </button>

          {/* Grid / List view toggles */}
          <div className="flex items-center border border-[#1f1f1f] bg-[#0a0a0a] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#181818] text-[#ededed]'
                  : 'text-[#666666] hover:text-[#ededed]'
              }`}
              title="Grid view"
            >
              <span className="material-symbols-outlined text-[15px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#181818] text-[#ededed]'
                  : 'text-[#666666] hover:text-[#ededed]'
              }`}
              title="List view"
            >
              <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
            </button>
          </div>

          {/* Add New ⌄ dropdown button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddNewMenu(!showAddNewMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffffff] text-[#000000] font-semibold text-xs hover:bg-[#eaeaea] transition-all cursor-pointer shadow-xs"
            >
              <span>Add New</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>

            {showAddNewMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-[#0a0a0a] border border-[#222222] rounded-xl shadow-2xl p-1 z-30 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNewMenu(false);
                    onOpenImportModal();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-[#ededed] hover:bg-[#161616] transition-colors cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0070f3]">
                    account_tree
                  </span>
                  <span>Import Git Repository</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddNewMenu(false);
                    onOpenImportModal();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-[#ededed] hover:bg-[#161616] transition-colors cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#00df72]">
                    auto_fix_high
                  </span>
                  <span>Self-Healing Test Suite</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Usage Card & Alerts Card */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Usage Card */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-xs text-[#ededed]">Usage</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#777777]">Last 30 days</span>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded-full bg-[#181818] border border-[#2a2a2a] text-[#ededed] text-[10px] font-medium hover:bg-[#222222] transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            </div>

            {/* Circular Progress telemetry items matching screenshot */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a1a1a1]">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#333333] border-t-[#0070f3] rotate-45 shrink-0"></span>
                  <span>Functions Storage</span>
                  <span className="text-[#555555] text-[10px]">ℹ</span>
                </div>
                <span className="font-mono text-[#a1a1a1] text-[11px]">320.2 MB / 10 GB</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a1a1a1]">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#333333] border-t-[#0070f3] rotate-90 shrink-0"></span>
                  <span>Deployment Storage</span>
                  <span className="text-[#555555] text-[10px]">ℹ</span>
                </div>
                <span className="font-mono text-[#a1a1a1] text-[11px]">11.97 MB / 10 GB</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a1a1a1]">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#333333] shrink-0"></span>
                  <span>CDN Requests</span>
                  <span className="text-[#555555] text-[10px]">ℹ</span>
                </div>
                <span className="font-mono text-[#a1a1a1] text-[11px]">7 / 1M</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#a1a1a1]">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#333333] shrink-0"></span>
                  <span>Fast Data Transfer</span>
                  <span className="text-[#555555] text-[10px]">ℹ</span>
                </div>
                <span className="font-mono text-[#a1a1a1] text-[11px]">12.84 KB / 100 GB</span>
              </div>

              {/* Self-healing telemetry indicator */}
              <div className="flex items-center justify-between pt-1 border-t border-[#181818]">
                <div className="flex items-center gap-2 text-[#00df72]">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-[#333333] border-t-[#00df72] rotate-180 shrink-0"></span>
                  <span className="font-medium">Self-Healing Automations</span>
                </div>
                <span className="font-mono text-[#00df72] text-[11px] font-semibold">99.4% Rate</span>
              </div>
            </div>

            <div className="flex justify-center pt-1 border-t border-[#181818]">
              <span className="material-symbols-outlined text-[15px] text-[#555555]">
                expand_more
              </span>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] flex flex-col items-center text-center gap-2 shadow-xs">
            <span className="font-semibold text-xs text-[#ededed] self-start">Alerts</span>
            <div className="py-2 flex flex-col items-center gap-1">
              <span className="font-bold text-xs text-[#ededed]">
                Get alerted for anomalies
              </span>
              <p className="text-[11px] text-[#777777] max-w-xs leading-relaxed">
                Automatically monitor your projects for locator breakages and get notified on Slack/GitHub.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-[#181818] border border-[#2a2a2a] text-[#ededed] text-xs font-medium hover:bg-[#222222] transition-colors cursor-pointer"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Right Column: Projects Grid */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-[#ededed]">Projects</span>
            <span className="text-[11px] text-[#777777]">
              {filteredProjects.length} connected repositories
            </span>
          </div>

          {/* Projects List/Grid */}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : 'flex flex-col gap-3'
            }
          >
            {filteredProjects.map((project) => {
              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="p-4 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333333] transition-all cursor-pointer flex flex-col justify-between gap-4 group shadow-xs hover:shadow-md"
                >
                  {/* Top: Icon + Name + Link + Status ring */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Project Icon */}
                      {project.iconType === 'teal-f' && (
                        <div className="w-8 h-8 rounded-full bg-[#0d9488]/20 border border-[#0d9488]/40 text-[#00df72] flex items-center justify-center font-bold text-sm shrink-0">
                          {project.iconLetter || 'F'}
                        </div>
                      )}
                      {project.iconType === 'yellow-polygon' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#f59e0b] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-white">
                            bolt
                          </span>
                        </div>
                      )}
                      {project.iconType === 'dark-n' && (
                        <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] text-[#ededed] flex items-center justify-center font-bold text-sm shrink-0">
                          {project.iconLetter || 'N'}
                        </div>
                      )}

                      {/* Name & Domain link */}
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm text-[#ededed] group-hover:text-[#0070f3] transition-colors truncate">
                          {project.name}
                        </span>
                        <span className="text-[11px] text-[#777777] font-mono truncate hover:underline">
                          {project.domain}
                        </span>
                      </div>
                    </div>

                    {/* Status circle with double checkmark matching screenshot */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-5 h-5 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 flex items-center justify-center" title="Self-Healing Healthy">
                        <span className="material-symbols-outlined text-[13px] text-[#22c55e]">
                          done_all
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[15px] text-[#555555]">
                        unfold_more
                      </span>
                    </div>
                  </div>

                  {/* Self-healing badge strip */}
                  <div className="flex items-center justify-between text-[11px] font-code-sm bg-[#111111] px-2.5 py-1 rounded-lg border border-[#1a1a1a]">
                    <span className="flex items-center gap-1 text-[#00df72]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00df72]"></span>
                      Self-Healing: {project.healingRate}
                    </span>
                    <span className="text-[#888888]">
                      {project.testRuns.length} test specs
                    </span>
                  </div>

                  {/* Footer Commit & Repo info */}
                  <div className="flex flex-col gap-1 pt-2 border-t border-[#181818] text-[11px] text-[#777777]">
                    <div className="flex items-center gap-1.5 text-[#a1a1a1]">
                      <span className="text-[#555555] font-mono text-xs">—o—</span>
                      <span className="truncate">{project.lastCommitMessage}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3 text-[#666666] shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span className="truncate">{project.repo} • {project.lastCommitDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
