import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export type NavDestination = 'projects' | 'dashboard' | 'healing-queue' | 'settings';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav: NavDestination;
  onNavigate: (destination: NavDestination) => void;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeNav,
  onNavigate,
  userName,
  userEmail,
  onSignOut,
  breadcrumbs = [],
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-100 flex flex-col font-sans">
      {/* TOPBAR */}
      <header className="h-14 border-b border-[#1f1f1f] bg-[#0f0f0f]/95 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center overflow-hidden p-0.5">
              <img
                src="/mascot.png"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              GhostRunner
            </span>
          </div>

          {/* Breadcrumbs Trail */}
          {breadcrumbs.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-400 pl-3 border-l border-neutral-800 min-w-0">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-neutral-600">/</span>}
                  {crumb.onClick ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-white transition-colors truncate max-w-[140px] cursor-pointer"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-neutral-200 font-semibold truncate max-w-[180px]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick actions, Theme Toggle, User Avatar, Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Toggle theme mode"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Lockup */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
              {userName.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-white truncate max-w-[110px]">
                {userName}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[110px]">
                {userEmail}
              </span>
            </div>
          </div>

          {/* Logout Icon Button */}
          <button
            type="button"
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Sign out of GhostRunner"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </header>

      {/* BODY WITH PERSISTENT SIDEBAR */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* SIDEBAR (Desktop: 240px, Mobile: Drawer) */}
        <aside
          className={`fixed md:sticky top-14 bottom-0 left-0 w-60 bg-[#0c0c0c] border-r border-[#1f1f1f] flex flex-col justify-between p-4 z-30 transition-transform duration-200 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Nav Links */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 px-3 py-1">
              Core Platform
            </span>

            <button
              type="button"
              onClick={() => {
                onNavigate('projects');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'projects'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              <span>Projects</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Dashboard Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate('healing-queue');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === 'healing-queue'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-amber-400">
                  auto_fix_high
                </span>
                <span>Healing Queue</span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
                1
              </span>
            </button>
          </div>

          {/* Bottom Card / System Status */}
          <div className="pt-4 border-t border-neutral-900 flex flex-col gap-2">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Self-Healing Proxy</span>
                <span className="text-emerald-400 font-mono font-semibold">Active</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                Target: Playwright &amp; Next.js 14
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
          />
        )}

        {/* MAIN PAGE VIEWPORT */}
        <main className="flex-1 min-w-0 bg-[#0a0a0a] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
