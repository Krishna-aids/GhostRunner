import React, { useState } from 'react';
import { GitHubProject } from '../types';
import { INITIAL_TEST_RUNS } from '../data/mockData';

interface ImportRepoModalProps {
  onClose: () => void;
  onImport: (newProject: GitHubProject) => void;
}

export const ImportRepoModal: React.FC<ImportRepoModalProps> = ({
  onClose,
  onImport,
}) => {
  const [repoName, setRepoName] = useState('Krishna-aids/e2e-checkout-suite');
  const [framework, setFramework] = useState<'Playwright' | 'Cypress' | 'Selenium'>('Playwright');
  const [branch, setBranch] = useState('main');
  const [autoHeal, setAutoHeal] = useState(true);
  const [confidence, setConfidence] = useState(70);
  const [importing, setImporting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);

    setTimeout(() => {
      const parts = repoName.split('/');
      const shortName = parts[parts.length - 1] || 'custom-app';

      const newProj: GitHubProject = {
        id: `proj-${Date.now()}`,
        name: shortName.toLowerCase(),
        slug: shortName.toLowerCase(),
        domain: `${shortName.toLowerCase()}.vercel.app`,
        repo: repoName,
        branch: branch,
        lastCommitMessage: 'Add GhostRunner self-healing test automation config',
        lastCommitDate: 'Just now',
        iconType: 'teal-f',
        iconLetter: shortName.charAt(0).toUpperCase(),
        selfHealingActive: autoHeal,
        healingRate: '100%',
        totalRuns: 1,
        pendingHeals: 0,
        lastRunStatus: 'healthy',
        framework: framework,
        testRuns: INITIAL_TEST_RUNS,
      };

      onImport(newProj);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#0a0a0a] rounded-2xl shadow-2xl border border-[#222222] w-full max-w-lg flex flex-col overflow-hidden text-xs text-[#ededed]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[#0070f3]">
                add_box
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-[#ededed]">
                Import & Test GitHub Repository
              </span>
              <span className="text-[11px] text-[#888888]">
                Self-healing test automation powered by BrowserStack & GhostRunner
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#666666] hover:text-[#ededed] hover:bg-[#181818] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#ededed] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#888888]">
                account_tree
              </span>
              GitHub Repository (owner/repo)
            </label>
            <input
              type="text"
              required
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="e.g. Krishna-aids/Table-Talk or facebook/react"
              className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#0070f3]"
            />
            <span className="text-[11px] text-[#777777]">
              Enter any public or private GitHub repository to run self-healing tests.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#ededed]">E2E Framework</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as any)}
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#ededed] focus:outline-none focus:border-[#0070f3]"
              >
                <option value="Playwright">Playwright</option>
                <option value="Cypress">Cypress</option>
                <option value="Selenium">Selenium WebDriver</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#ededed]">Target Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-[#111111] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#ededed] focus:outline-none focus:border-[#0070f3]"
              />
            </div>
          </div>

          {/* Self-healing configuration */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#222222] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-[#ededed]">
                  Autonomous Locator Recovery
                </span>
                <span className="text-[11px] text-[#777777]">
                  Dynamically mutates broken CSS/XPath selectors during execution
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoHeal}
                onChange={(e) => setAutoHeal(e.target.checked)}
                className="accent-[#0070f3] w-4 h-4 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
              <span className="text-[#888888]">Confidence Cutoff Threshold:</span>
              <span className="font-mono text-[#00df72] font-semibold">{confidence}%</span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f1f1f]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#2a2a2a] text-[#ededed] text-xs hover:bg-[#181818] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importing}
              className="px-4 py-1.5 rounded-lg bg-[#ffffff] text-[#000000] font-semibold text-xs hover:bg-[#eaeaea] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {importing ? 'Connecting & Verifying...' : 'Import & Run Tests'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
