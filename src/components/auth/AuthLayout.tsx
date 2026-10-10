import React from 'react';
import { ThemeToggle } from '../ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  onLaunchDemoConsole?: () => void;
}

export const GHOSTRUNNER_LOGO_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAWipWggVeqSAcbSqiwXIe3oGk4VZEyU7NwyTuoqToHWKaTPoZ5RJABX3rk5CE7aD5cii7FeWroTg92xPIpxEmgW0HTJKs93o1w58hcwVv45oH45FXawQLOCJt3TnanUx5U3V2CxIHvCqH27gd9AyAS9zsa_kL__LEDAaXRyW2BKSoYtqyJzIIu9KmTw2ZkYsHWNEXaBsqwsh9AUnUd5X0gfZDhwkbAVQZSDiMsREPg0S1bQAogwtOllsm7ZVzjOj7tfg';

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  onNavigateHome,
  onLaunchDemoConsole,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070c18] text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Top minimal header bar with Brand Wordmark & Back link & Theme Toggle */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer group"
          title="Return to GhostRunner Home"
        >
          <img
            alt="GhostRunner"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src={GHOSTRUNNER_LOGO_URL}
          />
          <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white">
            GhostRunner
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          {onLaunchDemoConsole && (
            <button
              type="button"
              onClick={onLaunchDemoConsole}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700/60 transition-colors cursor-pointer"
            >
              <span>Explore Demo Console</span>
              <span className="text-[14px] material-symbols-outlined">arrow_forward</span>
            </button>
          )}

          {/* Theme Toggle in Auth Header */}
          <ThemeToggle variant="icon" className="text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800" />

          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 px-2 py-1"
          >
            <span className="text-[14px] material-symbols-outlined">chevron_left</span>
            <span>Back to site</span>
          </button>
        </div>
      </header>

      {/* Center main authentication container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          {/* Main Card */}
          <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/80 transition-all">
            {/* Center Brand Icon Badge */}
            <div className="flex justify-center mb-5">
              <div
                onClick={onNavigateHome}
                className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 shadow-xs dark:shadow-inner cursor-pointer hover:border-blue-500/60 dark:hover:border-slate-700 transition-colors"
                title="GhostRunner"
              >
                <img
                  alt="GhostRunner"
                  className="w-full h-full object-contain"
                  src={GHOSTRUNNER_LOGO_URL}
                />
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>

      {/* Customer Trust Footer matching reference */}
      <footer className="relative z-10 w-full py-8 px-4 flex flex-col items-center justify-center border-t border-slate-200/80 dark:border-slate-900/60 text-center transition-colors">
        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase mb-4">
          Giving time back to QA & engineering teams at
        </p>
        <div className="flex items-center justify-center flex-wrap gap-6 sm:gap-10 text-slate-500 dark:text-slate-400/70 text-xs font-semibold">
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[16px] text-blue-500 dark:text-blue-400">bolt</span>
            <span className="tracking-tight">rapidAND</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[16px] text-emerald-500 dark:text-emerald-400">rocket_launch</span>
            <span className="tracking-tight">hyperscale</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[16px] text-purple-500 dark:text-purple-400">terminal</span>
            <span className="tracking-tight">devstack.io</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[16px] text-cyan-500 dark:text-cyan-400">layers</span>
            <span className="tracking-tight">cloudmesh</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
