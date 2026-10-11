import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SettingsViewProps {
  engineActive: boolean;
  onToggleEngine: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  engineActive,
  onToggleEngine,
}) => {
  const { mode, setMode } = useTheme();
  const [threshold, setThreshold] = useState<number>(70);
  const [autoPR, setAutoPR] = useState<boolean>(true);
  const [autoHealStrict, setAutoHealStrict] = useState<boolean>(true);
  const [strategyPriority, setStrategyPriority] = useState<string[]>([
    'data-testid / data-cy',
    'role + accessible-name (ARIA)',
    'semantic id (#checkout-submit)',
    'stable text content regex',
    'CSS class hierarchical tree',
  ]);
  const [savedBanner, setSavedBanner] = useState<boolean>(false);

  const handleSave = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const moveStrategy = (index: number, direction: 'up' | 'down') => {
    const newPriority = [...strategyPriority];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPriority.length) return;
    const temp = newPriority[index];
    newPriority[index] = newPriority[targetIndex];
    newPriority[targetIndex] = temp;
    setStrategyPriority(newPriority);
  };

  return (
    <div className="flex flex-col gap-space-lg max-w-4xl">
      {/* Title & Save Changes Action - Issue 2 (Typographic Hierarchy) & Issue 5 (Vertical Center Alignment) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
            Engine & Pipeline Settings
          </h1>

          <button
            onClick={handleSave}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-medium text-sm hover:opacity-95 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save Changes</span>
          </button>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          Configure neural selector matching sensitivity, autonomous PR creation, and Playwright execution parameters.
        </p>
      </div>

      {savedBanner && (
        <div
          role="status"
          aria-live="polite"
          className="p-space-md bg-status-success-subtle text-status-success border border-status-success/30 rounded-xl flex items-center gap-2 animate-in fade-in duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-medium text-body-sm">
            GhostRunner settings saved and synchronized across all active test worker nodes.
          </span>
        </div>
      )}

      {/* Appearance & Color Theme - Issue 4 (Consolidation to Cards) & Issue 3 (Body Text >= 12px) */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-xs flex flex-col gap-space-md">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-text-primary">
            Appearance & Color Theme
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Customize interface contrast and ambient tone. GhostRunner adapts instantly across the Console, Landing Page, and Auth views.
          </p>
        </div>

        {/* Consolidated Theme Cards (Single UI Pattern) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setMode('light')}
            aria-pressed={mode === 'light'}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'light'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">light_mode</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary">Light Theme</span>
              </div>
              {mode === 'light' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Crisp white canvases, high legibility dark typography, and light gray structural dividers.
            </p>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setMode('dark')}
            aria-pressed={mode === 'dark'}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'dark'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-400">dark_mode</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary">Dark Theme</span>
              </div>
              {mode === 'dark' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Deep indigo/slate surfaces, reduced glare for QA night shifts, and vibrant status metrics.
            </p>
          </button>

          {/* System Default Card */}
          <button
            type="button"
            onClick={() => setMode('system')}
            aria-pressed={mode === 'system'}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'system'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-purple-400">desktop_windows</span>
                <span className="text-xs sm:text-sm font-semibold text-text-primary">System Default</span>
              </div>
              {mode === 'system' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Automatically synchronizes with your operating system or browser display mode.
            </p>
          </button>
        </div>
      </div>

      {/* 1. Core Engine Mode - Issue 6 (Consistent Toggle Color) & Issue 8 (Slider Thumb Position Alignment) */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-xs flex flex-col gap-space-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-text-primary">
              Autonomous Self-Healing Engine
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              When enabled, failed locators trigger dynamic DOM candidate synthesis without halting the assertion tree.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={engineActive}
            aria-label="Toggle Autonomous Self-Healing Engine"
            onClick={onToggleEngine}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              engineActive ? 'bg-primary' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                engineActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <hr className="border-border-subtle" />

        {/* Confidence Threshold Slider - Issue 8 (Position value directly above slider thumb) */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <label htmlFor="confidence-slider" className="text-sm font-semibold text-text-primary">
              Minimum Match Confidence Threshold
            </label>
            <span className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Candidates below this threshold will not be executed automatically and will route to the Healing Queue.
            </span>
          </div>

          {/* Slider with dynamic indicator tooltip floating directly over thumb */}
          <div className="relative pt-7 pb-1 mt-1">
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-75"
              style={{ left: `${((threshold - 50) / (95 - 50)) * 100}%` }}
            >
              <span className="font-mono text-xs font-bold text-primary bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle shadow-xs">
                {threshold}%
              </span>
              <div className="w-1.5 h-1.5 bg-surface-subtle border-r border-b border-border-subtle rotate-45 -mt-1" />
            </div>

            <input
              id="confidence-slider"
              type="range"
              min={50}
              max={95}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Minimum Match Confidence Threshold"
              aria-valuenow={threshold}
              aria-valuemin={50}
              aria-valuemax={95}
              className="w-full accent-primary cursor-pointer block"
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-text-muted">
            <span>50% (Permissive)</span>
            <span className="text-primary font-semibold">70% (Recommended)</span>
            <span>95% (Strict)</span>
          </div>
        </div>
      </div>

      {/* 2. Selector Strategy Priority - Issue 7 (Disabled Visual State on First Up and Last Down Arrows) */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-xs flex flex-col gap-space-md">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-text-primary">
            Synthesized Selector Priority Hierarchy
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            GhostRunner prefers generating locators using the order below when multiple stable matches exist.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {strategyPriority.map((strategy, idx) => (
            <div
              key={strategy}
              className="flex items-center justify-between p-space-sm bg-surface-subtle rounded-lg border border-border-subtle"
            >
              <div className="flex items-center gap-space-sm">
                <span className="font-mono text-xs text-text-muted w-6 text-center">{idx + 1}.</span>
                <span className="font-mono text-xs sm:text-sm text-text-primary font-medium">{strategy}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  aria-disabled={idx === 0}
                  onClick={() => moveStrategy(idx, 'up')}
                  className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-transparent"
                  title="Move up"
                  aria-label={`Move ${strategy} up`}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  disabled={idx === strategyPriority.length - 1}
                  aria-disabled={idx === strategyPriority.length - 1}
                  onClick={() => moveStrategy(idx, 'down')}
                  className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:bg-transparent"
                  title="Move down"
                  aria-label={`Move ${strategy} down`}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GitHub & CI/CD Automated PRs - Issue 6 (Consistent Toggle Color) */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-xs flex flex-col gap-space-md">
        <h2 className="text-base font-semibold text-text-primary">
          CI/CD Codebase Synchronization
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              Automatic GitHub Pull Request Creation
            </span>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Open automated PRs on approved heals with git branch pattern: <code className="text-xs bg-surface-subtle px-1 rounded">ghostrunner/heal-[spec]</code>.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoPR}
            aria-label="Toggle Automatic GitHub Pull Request Creation"
            onClick={() => setAutoPR(!autoPR)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              autoPR ? 'bg-primary' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                autoPR ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border-subtle">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-text-primary">
              Strict Playwright Disambiguation
            </span>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Ensure synthesized locator matches exactly 1 node in the current DOM frame.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={autoHealStrict}
            aria-label="Toggle Strict Playwright Disambiguation"
            onClick={() => setAutoHealStrict(!autoHealStrict)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              autoHealStrict ? 'bg-primary' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                autoHealStrict ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
