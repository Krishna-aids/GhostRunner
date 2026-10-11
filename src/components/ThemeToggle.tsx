import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'segmented';
  className?: string;
  showTooltip?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  showTooltip = true,
}) => {
  const { theme, mode, setMode, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-surface-subtle border border-border-subtle ${className}`}
        role="group"
        aria-label="Theme mode selector"
      >
        <button
          type="button"
          onClick={() => setMode('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'light'
              ? 'bg-surface-canvas text-text-primary shadow-xs font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">light_mode</span>
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'dark'
              ? 'bg-surface-canvas text-text-primary shadow-xs font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dark_mode</span>
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('system')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'system'
              ? 'bg-surface-canvas text-text-primary shadow-xs font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
          <span>System</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-subtle hover:bg-surface-container border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer ${className}`}
        title={`Currently in ${theme} mode. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode.`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">
            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
          <span className="capitalize">{theme} Theme</span>
        </div>
        <span className="text-[11px] text-text-muted">
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </span>
      </button>
    );
  }

  // Default: variant === 'icon'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      title={showTooltip ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme` : undefined}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-all cursor-pointer border border-transparent hover:border-border-subtle focus:outline-none focus:ring-1 focus:ring-primary/40 ${className}`}
    >
      <span className="material-symbols-outlined text-[20px] transition-transform duration-300 transform active:rotate-45 leading-none flex items-center justify-center">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};
