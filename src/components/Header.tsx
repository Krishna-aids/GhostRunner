import React, { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { AuthUser } from '../services/authService';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  selectedSuite: string;
  onSelectSuite: (suite: string) => void;
  selectedEnv: string;
  onSelectEnv: (env: string) => void;
  engineActive: boolean;
  onToggleEngine: () => void;
  onOpenDocs: () => void;
  onSignOut?: () => void;
  currentUser?: AuthUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  selectedSuite,
  onSelectSuite,
  selectedEnv,
  onSelectEnv,
  engineActive,
  onToggleEngine,
  onOpenDocs,
  onSignOut,
  currentUser,
}) => {
  const displayName = currentUser?.name || 'Elena Rostova';
  const displayEmail = currentUser?.email || 'elena.rostova@acme.corp';
  const displayRole = currentUser?.role || 'QA Lead';
  const displayAvatar =
    currentUser?.avatarUrl ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuClQsIR7bEguSlug4BrrJjeX5oQCIkUgXw_QZkIaWafVR1CGk6q8ZgITi3oKWNNaYVWPeU4Q94KOiGdViwUCG_PpARSOd6q6rpHK9Qu5Sjq7qmiFEmKMMb8ghwMtNxMnE2VEpID-Pishmdf2nJulyN1EIFnEWcrRSWSNTqTwShRx5qr_0hlU65cH-F5LSFOFJYn3Kpj7A4o56vhUs4gmUpGfVsBz8lmG3R6yd5SW5foGob6h0JXvfXd';
  const [suiteMenuOpen, setSuiteMenuOpen] = useState(false);
  const [envMenuOpen, setEnvMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  const suiteRef = useRef<HTMLDivElement>(null);
  const envRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suiteRef.current && !suiteRef.current.contains(event.target as Node)) {
        setSuiteMenuOpen(false);
      }
      if (envRef.current && !envRef.current.contains(event.target as Node)) {
        setEnvMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suites = [
    { id: 'checkout-suite', name: 'checkout-suite', app: 'Acme Web App', tests: 4 },
    { id: 'auth-suite', name: 'auth-suite', app: 'Acme Web App', tests: 12 },
    { id: 'inventory-suite', name: 'inventory-suite', app: 'Acme Web App', tests: 8 },
    { id: 'billing-api', name: 'billing-api', app: 'Acme Web App', tests: 19 },
  ];

  const environments = [
    { id: 'Staging v2.18', label: 'Staging v2.18', color: 'bg-status-success' },
    { id: 'Production Canary', label: 'Production Canary', color: 'bg-status-warning' },
    { id: 'Dev-Ephemeral-94', label: 'Dev-Ephemeral-94', color: 'bg-primary' },
  ];

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-14 bg-surface-canvas/95 backdrop-blur-md border-b border-border-subtle z-40 px-space-md lg:px-space-lg flex items-center justify-between">
      {/* Left zone: Mobile toggle & Suite dropdown */}
      <div className="flex items-center gap-space-sm sm:gap-space-md">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
          aria-label="Toggle navigation menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>

        {/* Suite Selector Dropdown */}
        <div className="relative" ref={suiteRef}>
          <button
            type="button"
            onClick={() => setSuiteMenuOpen(!suiteMenuOpen)}
            className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-subtle rounded border border-border-subtle hover:border-border-strong transition-colors text-left"
          >
            <span className="material-symbols-outlined text-[16px] text-text-secondary">inventory_2</span>
            <span className="font-code-md text-code-md text-text-primary font-medium hidden sm:inline">
              Acme Web App
            </span>
            <span className="text-border-strong font-mono hidden sm:inline">/</span>
            <span className="font-code-md text-code-md text-text-secondary">
              {selectedSuite}
            </span>
            <span className="material-symbols-outlined text-[16px] text-text-muted ml-0.5">
              expand_more
            </span>
          </button>

          {suiteMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-surface-canvas border border-border-strong rounded-xl shadow-lg z-50 p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                Select Suite
              </div>
              {suites.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSuite(s.name);
                    setSuiteMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-body-sm transition-colors ${
                    selectedSuite === s.name
                      ? 'bg-primary-container/10 text-primary font-medium'
                      : 'hover:bg-surface-subtle text-text-primary'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-code-md">{s.name}</span>
                    <span className="text-text-muted text-[11px]">{s.app}</span>
                  </div>
                  <span className="font-code-sm text-text-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                    {s.tests} tests
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Environment Badge Dropdown */}
        <div className="relative" ref={envRef}>
          <button
            type="button"
            onClick={() => setEnvMenuOpen(!envMenuOpen)}
            className="flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-muted border border-border-subtle hover:border-border-strong transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                environments.find((e) => e.id === selectedEnv)?.color || 'bg-status-success'
              }`}
            ></span>
            <span className="font-label-sm text-label-sm text-text-secondary font-medium">
              {selectedEnv}
            </span>
            <span className="material-symbols-outlined text-[14px] text-text-muted">expand_more</span>
          </button>

          {envMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-48 bg-surface-canvas border border-border-strong rounded-xl shadow-lg z-50 p-1 flex flex-col gap-0.5">
              <div className="px-3 py-1.5 font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                Target Environment
              </div>
              {environments.map((env) => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => {
                    onSelectEnv(env.id);
                    setEnvMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-left font-label-md text-label-md transition-colors ${
                    selectedEnv === env.id
                      ? 'bg-surface-container text-text-primary font-semibold'
                      : 'hover:bg-surface-subtle text-text-secondary'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${env.color}`}></span>
                  <span>{env.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right zone: Engine status badge, Notifications & Profile */}
      <div className="flex items-center gap-space-sm sm:gap-space-lg">
        {/* Distinct Status Indicators: Split into Engine State and Self-Healing Toggle */}
        <div className="hidden md:flex items-center gap-2">
          {/* 1. Live Engine Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-subtle border border-border-subtle text-xs font-medium text-text-secondary select-none">
            <span className={`w-2 h-2 rounded-full ${engineActive ? 'bg-status-success animate-pulse' : 'bg-text-muted'}`} />
            <span>{engineActive ? 'Engine Active' : 'Engine Paused'}</span>
          </div>

          {/* 2. Interactive Self-Healing Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleEngine}
            aria-label={`Toggle self-healing: currently ${engineActive ? 'enabled' : 'disabled'}`}
            title="Click to toggle autonomous self-healing mode"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
              engineActive
                ? 'bg-status-healed-subtle border-status-healed/40 text-status-healed hover:bg-status-healed/20'
                : 'bg-surface-muted border-border-subtle text-text-muted hover:text-text-primary hover:border-border-strong'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
            <span>Self-Healing: {engineActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="flex items-center gap-space-sm">
          {/* Dark / Light Theme Toggle */}
          <ThemeToggle variant="icon" />

          {/* Notifications Button */}
          <div className="relative" ref={notifRef}>
            <button
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (unreadNotifications > 0) setUnreadNotifications(0);
              }}
              className="relative p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface-canvas"></span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-canvas border border-border-strong rounded-xl shadow-xl z-50 p-space-sm flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
                  <span className="font-headline-sm text-[14px] font-semibold text-text-primary">
                    Real-Time Healing Notifications
                  </span>
                  <span className="font-code-sm text-status-healed bg-status-healed-subtle px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                  <div className="p-2 rounded-lg bg-status-healed-subtle/50 border border-status-healed/20 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-status-healed mt-0.5">
                      auto_fix_high
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-label-md text-text-primary text-[12px] font-semibold">
                        Selector Healed: test_checkout_flow.spec.ts
                      </span>
                      <span className="font-code-sm text-[11px] text-text-secondary">
                        button#checkout-submit ➔ button[data-testid="place-order-cta"] (94% conf)
                      </span>
                      <span className="text-text-muted text-[10px] mt-0.5">12 minutes ago</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-subtle border border-border-subtle flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-status-warning mt-0.5">
                      warning
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-label-md text-text-primary text-[12px] font-semibold">
                        Heal Flagged for Review: test_inventory_modal.spec.ts
                      </span>
                      <span className="font-body-sm text-[11px] text-text-secondary">
                        Confidence 64% below safety threshold 70%. Routed to Healing Queue.
                      </span>
                      <span className="text-text-muted text-[10px] mt-0.5">1 hour ago</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-surface-subtle border border-border-subtle flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-status-healed mt-0.5">
                      check_circle
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-label-md text-text-primary text-[12px] font-semibold">
                        PR #402 merged into staging
                      </span>
                      <span className="font-body-sm text-[11px] text-text-secondary">
                        2 auto-healed selectors written back to codebase.
                      </span>
                      <span className="text-text-muted text-[10px] mt-0.5">2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-[1px] bg-border-subtle mx-1"></div>

          {/* User profile avatar and dropdown */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 focus:outline-none"
              title={`${displayName} (${displayRole})`}
            >
              <img
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-border-subtle hover:ring-primary cursor-pointer transition-all"
                src={displayAvatar}
              />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-canvas border border-border-strong rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5 animate-fadeIn">
                <div className="px-3 py-2 border-b border-border-subtle mb-1">
                  <p className="text-xs font-semibold text-text-primary">{displayName}</p>
                  <p className="text-[11px] text-text-muted truncate font-mono">{displayEmail}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-status-success bg-status-success-subtle px-1.5 py-0.5 rounded border border-status-success/30">
                    {displayRole} • {currentUser?.provider === 'google' ? 'Google SSO' : 'Supabase Auth'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onOpenDocs();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>Documentation & Guides</span>
                </button>

                <div className="px-2.5 py-1.5 flex items-center justify-between border-t border-border-subtle mt-0.5">
                  <span className="text-xs text-text-secondary font-medium">Appearance</span>
                  <ThemeToggle variant="segmented" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (onSignOut) onSignOut();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-status-failure hover:bg-status-failure-subtle transition-colors text-left cursor-pointer font-medium mt-1 border-t border-border-subtle"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
