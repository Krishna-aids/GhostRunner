import React, { useState, useRef, useEffect } from 'react';

export type AppTab = 'dashboard' | 'projects' | 'test-runs' | 'healing-queue' | 'settings';

interface SidebarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onGoToLanding?: () => void;
  onSignOut?: () => void;
  healingCount: number;
  onOpenDocs: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onGoToLanding,
  onSignOut,
  healingCount,
  onOpenDocs,
  mobileOpen,
  onCloseMobile,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-canvas border-r border-border-subtle z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Version Header */}
          <div className="h-14 px-space-lg flex items-center justify-between border-b border-border-subtle">
            <div
              className="flex items-center gap-space-sm cursor-pointer"
              title="Return to Landing Page"
              onClick={() => {
                if (onGoToLanding) {
                  onGoToLanding();
                } else {
                  onSelectTab('dashboard');
                }
                onCloseMobile();
              }}
            >
              <img
                alt="GhostRunner Logo"
                className="h-8 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWipWggVeqSAcbSqiwXIe3oGk4VZEyU7NwyTuoqToHWKaTPoZ5RJABX3rk5CE7aD5cii7FeWroTg92xPIpxEmgW0HTJKs93o1w58hcwVv45oH45FXawQLOCJt3TnanUx5U3V2CxIHvCqH27gd9AyAS9zsa_kL__LEDAaXRyW2BKSoYtqyJzIIu9KmTw2ZkYsHWNEXaBsqwsh9AUnUd5X0gfZDhwkbAVQZSDiMsREPg0S1bQAogwtOllsm7ZVzjOj7tfg"
              />
              <span className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">
                GhostRunner
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-code-sm text-code-sm bg-surface-muted text-text-secondary px-space-xs py-0.5 rounded border border-border-subtle">
                v2.4
              </span>
              <button
                className="lg:hidden p-1 text-text-secondary hover:text-text-primary"
                onClick={onCloseMobile}
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="p-space-md">
            <div className="px-space-sm py-space-xs font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
              Navigation
            </div>
            <nav className="flex flex-col gap-1 mt-1">
              {/* Dashboard */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('dashboard');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  <span className="font-label-md text-label-md">Dashboard</span>
                </div>
              </button>

              {/* Projects */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('projects');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                  currentTab === 'projects'
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">folder_special</span>
                  <span className="font-label-md text-label-md">Projects</span>
                </div>
              </button>

              {/* Test Runs */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('test-runs');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                  currentTab === 'test-runs'
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  <span className="font-label-md text-label-md">Test Runs</span>
                </div>
              </button>

              {/* Healing Queue */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('healing-queue');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                  currentTab === 'healing-queue'
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                  <span className="font-label-md text-label-md">Healing Queue</span>
                </div>
                {healingCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-xs transition-all ${
                      currentTab === 'healing-queue'
                        ? 'bg-white text-primary font-extrabold'
                        : 'bg-primary text-white font-bold'
                    }`}
                  >
                    {healingCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  onSelectTab('settings');
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-space-sm py-space-sm rounded-lg transition-colors text-left cursor-pointer ${
                  currentTab === 'settings'
                    ? 'bg-primary-container text-on-primary font-medium shadow-sm'
                    : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span className="font-label-md text-label-md">Settings</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer info & user card */}
        <div className="flex flex-col border-t border-border-subtle p-space-md bg-surface-canvas">
          <div className="relative px-space-xs" ref={userMenuRef}>
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-space-sm min-w-0 cursor-pointer"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="relative flex-shrink-0">
                  <img
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-border-subtle"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuClQsIR7bEguSlug4BrrJjeX5oQCIkUgXw_QZkIaWafVR1CGk6q8ZgITi3oKWNNaYVWPeU4Q94KOiGdViwUCG_PpARSOd6q6rpHK9Qu5Sjq7qmiFEmKMMb8ghwMtNxMnE2VEpID-Pishmdf2nJulyN1EIFnEWcrRSWSNTqTwShRx5qr_0hlU65cH-F5LSFOFJYn3Kpj7A4o56vhUs4gmUpGfVsBz8lmG3R6yd5SW5foGob6h0JXvfXd"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-status-success ring-1 ring-surface-canvas"></span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-text-primary truncate font-medium leading-none">
                    Elena Rostova
                  </span>
                  <span className="font-label-sm text-label-sm text-text-muted truncate mt-1 leading-none">
                    QA Lead
                  </span>
                </div>
              </div>

              <button
                aria-label="User menu"
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-subtle transition-colors cursor-pointer"
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Profile & Session info"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface-canvas border border-border-strong rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 animate-fadeIn">
                <div className="px-2.5 py-1.5 border-b border-border-subtle mb-1">
                  <p className="text-xs font-semibold text-text-primary">Elena Rostova</p>
                  <p className="text-[11px] text-text-muted truncate font-mono">elena.rostova@acme.corp</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenDocs();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>Documentation & SDK</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (onSignOut) {
                      onSignOut();
                    } else if (onGoToLanding) {
                      onGoToLanding();
                    }
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-status-failure hover:bg-status-failure-subtle transition-colors text-left cursor-pointer font-medium mt-0.5 border-t border-border-subtle"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
