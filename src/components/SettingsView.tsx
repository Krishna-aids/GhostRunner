import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

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
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-headline-lg text-headline-lg text-text-primary">
            Engine & Pipeline Settings
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Configure neural selector matching sensitivity, autonomous PR creation, and Playwright execution parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-xl bg-primary-container text-on-primary font-label-md font-semibold hover:opacity-95 shadow-sm transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          <span>Save Changes</span>
        </button>
      </div>

      {savedBanner && (
        <div className="p-space-md bg-status-success-subtle text-status-success border border-status-success/30 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-medium text-body-sm">
            GhostRunner settings saved and synchronized across all active test worker nodes.
          </span>
        </div>
      )}

      {/* Appearance & Color Theme */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-headline-sm text-text-primary">
              Appearance & Color Theme
            </span>
            <span className="font-body-sm text-text-secondary">
              Customize interface contrast and ambient tone. GhostRunner adapts instantly across the Console, Landing Page, and Auth views.
            </span>
          </div>

          <ThemeToggle variant="segmented" />
        </div>

        {/* Theme Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-subtle">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setMode('light')}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'light'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-500">light_mode</span>
                <span className="font-label-md text-text-primary font-semibold">Light Theme</span>
              </div>
              {mode === 'light' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Crisp white canvases, high legibility dark typography, and light gray structural dividers.
            </p>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setMode('dark')}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'dark'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-400">dark_mode</span>
                <span className="font-label-md text-text-primary font-semibold">Dark Theme</span>
              </div>
              {mode === 'dark' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Deep indigo/slate surfaces, reduced glare for QA night shifts, and vibrant status metrics.
            </p>
          </button>

          {/* System Default Card */}
          <button
            type="button"
            onClick={() => setMode('system')}
            className={`flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === 'system'
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border-subtle hover:border-border-strong bg-surface-subtle'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-purple-400">desktop_windows</span>
                <span className="font-label-md text-text-primary font-semibold">System Default</span>
              </div>
              {mode === 'system' && (
                <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              )}
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Automatically synchronizes with your operating system or browser display mode.
            </p>
          </button>
        </div>
      </div>

      {/* 1. Core Engine Mode */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-headline-sm text-text-primary">
              Autonomous Self-Healing Engine
            </span>
            <span className="font-body-sm text-text-secondary">
              When enabled, failed locators trigger dynamic DOM candidate synthesis without halting the assertion tree.
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleEngine}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              engineActive ? 'bg-status-healed' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                engineActive ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        <hr className="border-border-subtle" />

        {/* Confidence Threshold Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-text-primary font-semibold">
                Minimum Match Confidence Threshold
              </span>
              <span className="font-body-sm text-text-secondary">
                Candidates below this threshold will not be executed automatically and will route to the Healing Queue.
              </span>
            </div>
            <span className="font-code-md text-lg font-bold text-primary px-2 py-0.5 bg-surface-subtle rounded border border-border-subtle">
              {threshold}%
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={95}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer mt-2"
          />
          <div className="flex justify-between text-xs font-code-sm text-text-muted">
            <span>50% (Permissive)</span>
            <span className="text-status-healed font-semibold">70% (Recommended)</span>
            <span>95% (Strict)</span>
          </div>
        </div>
      </div>

      {/* 2. Selector Strategy Priority */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col gap-space-md">
        <div className="flex flex-col">
          <span className="font-headline-sm text-text-primary">
            Synthesized Selector Priority Hierarchy
          </span>
          <span className="font-body-sm text-text-secondary">
            GhostRunner prefers generating locators using the order below when multiple stable matches exist.
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {strategyPriority.map((strategy, idx) => (
            <div
              key={strategy}
              className="flex items-center justify-between p-space-sm bg-surface-subtle rounded-lg border border-border-subtle"
            >
              <div className="flex items-center gap-space-sm">
                <span className="font-code-sm text-text-muted w-6 text-center">{idx + 1}.</span>
                <span className="font-code-md text-text-primary font-medium">{strategy}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveStrategy(idx, 'up')}
                  className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-20 cursor-pointer"
                  title="Move up"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  disabled={idx === strategyPriority.length - 1}
                  onClick={() => moveStrategy(idx, 'down')}
                  className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-20 cursor-pointer"
                  title="Move down"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. GitHub & CI/CD Automated PRs */}
      <div className="bg-surface-canvas rounded-xl p-space-lg border border-border-subtle shadow-sm flex flex-col gap-space-md">
        <span className="font-headline-sm text-text-primary">
          CI/CD Codebase Synchronization
        </span>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-text-primary font-semibold">
              Automatic GitHub Pull Request Creation
            </span>
            <span className="font-body-sm text-text-secondary">
              Open automated PRs on approved heals with git branch pattern: <code className="text-xs bg-surface-subtle px-1 rounded">ghostrunner/heal-[spec]</code>.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutoPR(!autoPR)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              autoPR ? 'bg-primary' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoPR ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <div className="flex flex-col">
            <span className="font-label-md text-text-primary font-semibold">
              Strict Playwright Disambiguation
            </span>
            <span className="font-body-sm text-text-secondary">
              Ensure synthesized locator matches exactly 1 node in the current DOM frame.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAutoHealStrict(!autoHealStrict)}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              autoHealStrict ? 'bg-primary' : 'bg-surface-container'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoHealStrict ? 'translate-x-6' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};
