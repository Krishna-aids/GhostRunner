import React from 'react';

interface VercelHeaderProps {
  onToggleMobileMenu: () => void;
  activeNavTab: string;
  onSelectNavTab: (tab: string) => void;
  onOpenAgent: () => void;
  selectedProjectName?: string;
  onSelectAllProjects?: () => void;
}

export const VercelHeader: React.FC<VercelHeaderProps> = ({
  onToggleMobileMenu,
  activeNavTab,
  onSelectNavTab,
  onOpenAgent,
  selectedProjectName,
  onSelectAllProjects,
}) => {
  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-14 bg-[#000000]/90 backdrop-blur-md border-b border-[#1a1a1a] z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Project Scope Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[#888888] hover:text-[#ededed] hover:bg-[#141414]"
          aria-label="Toggle navigation"
        >
          <span className="material-symbols-outlined text-[19px]">menu</span>
        </button>

        <button
          type="button"
          onClick={onSelectAllProjects}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[#ededed] hover:bg-[#141414] transition-colors cursor-pointer border border-transparent hover:border-[#222222]"
        >
          <span>{selectedProjectName ? selectedProjectName : 'All Projects'}</span>
          <span className="material-symbols-outlined text-[15px] text-[#666666]">
            unfold_more
          </span>
        </button>
      </div>

      {/* Center: Tabs (Overview, etc.) */}
      <div className="hidden md:flex items-center gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => onSelectNavTab('overview')}
          className={`h-14 flex items-center border-b-2 transition-colors cursor-pointer ${
            activeNavTab === 'overview'
              ? 'border-[#ededed] text-[#ededed] font-semibold'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => onSelectNavTab('test-runs')}
          className={`h-14 flex items-center border-b-2 transition-colors cursor-pointer ${
            activeNavTab === 'test-runs'
              ? 'border-[#ededed] text-[#ededed] font-semibold'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
        >
          Self-Healing Tests
        </button>

        <button
          type="button"
          onClick={() => onSelectNavTab('healing-queue')}
          className={`h-14 flex items-center border-b-2 transition-colors cursor-pointer ${
            activeNavTab === 'healing-queue'
              ? 'border-[#ededed] text-[#ededed] font-semibold'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
        >
          Healing Queue
        </button>

        <button
          type="button"
          onClick={() => onSelectNavTab('settings')}
          className={`h-14 flex items-center border-b-2 transition-colors cursor-pointer ${
            activeNavTab === 'settings'
              ? 'border-[#ededed] text-[#ededed] font-semibold'
              : 'border-transparent text-[#888888] hover:text-[#ededed]'
          }`}
        >
          Settings
        </button>
      </div>

      {/* Right: Agent button with sparkle icon */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAgent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-xs font-medium text-[#ededed] hover:border-[#444444] hover:bg-[#141414] transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-[16px] text-[#0070f3]">
            auto_awesome
          </span>
          <span>Agent</span>
        </button>
      </div>
    </header>
  );
};
