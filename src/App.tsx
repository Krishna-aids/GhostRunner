/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, AppTab } from './components/Sidebar';
import { Header } from './components/Header';
import { TelemetryCards } from './components/TelemetryCards';
import { TestRunsTable } from './components/TestRunsTable';
import { HealingQueueView } from './components/HealingQueueView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { LandingPage } from './components/LandingPage';
import { ConnectProjectView } from './components/ConnectProjectView';
import { TraceViewerModal } from './components/TraceViewerModal';
import { RunSuiteModal } from './components/RunSuiteModal';
import { ExportReportModal } from './components/ExportReportModal';
import { InvestigateModal } from './components/InvestigateModal';
import { DocsDrawer } from './components/DocsDrawer';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ThemeProvider } from './context/ThemeContext';
import { INITIAL_METRICS, INITIAL_TEST_RUNS, INITIAL_HEALING_QUEUE } from './data/mockData';
import { TestRun, HealingQueueItem, MetricSummary } from './types';

export type AppRoute = 'landing' | 'signin' | 'signup' | 'forgot-password' | 'app';

function AppContent() {
  const getInitialRoute = (): AppRoute => {
    if (typeof window === 'undefined') return 'landing';
    const path = window.location.pathname.toLowerCase();
    if (path === '/signin' || path.startsWith('/signin')) return 'signin';
    if (path === '/signup' || path.startsWith('/signup')) return 'signup';
    if (path === '/forgot-password' || path.startsWith('/forgot-password')) return 'forgot-password';
    if (path === '/app' || path === '/dashboard' || path === '/console') return 'app';
    return 'landing';
  };

  // Root view mode: 'landing' | 'signin' | 'signup' | 'forgot-password' | 'app'
  const [route, setRoute] = useState<AppRoute>(getInitialRoute);

  // App internal tab navigation (Dashboard, Projects, Test Runs, Healing Queue, Settings)
  const [currentTab, setCurrentTab] = useState<AppTab>('projects');
  const [testRuns, setTestRuns] = useState<TestRun[]>(INITIAL_TEST_RUNS);
  const [healingQueue, setHealingQueue] = useState<HealingQueueItem[]>(INITIAL_HEALING_QUEUE);
  const [metrics, setMetrics] = useState<MetricSummary>(INITIAL_METRICS);
  const [engineActive, setEngineActive] = useState<boolean>(true);
  const [selectedSuite, setSelectedSuite] = useState<string>('checkout-suite');
  const [selectedEnv, setSelectedEnv] = useState<string>('Staging v2.18');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Sync route with browser popstate
  useEffect(() => {
    const handlePopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newRoute: AppRoute, initialTab?: AppTab) => {
    if (initialTab) {
      setCurrentTab(initialTab);
    }
    setRoute(newRoute);
    let path = '/';
    if (newRoute === 'signin') path = '/signin';
    else if (newRoute === 'signup') path = '/signup';
    else if (newRoute === 'forgot-password') path = '/forgot-password';
    else if (newRoute === 'app') path = '/app';

    if (window.location.pathname !== path) {
      try {
        window.history.pushState({}, '', path);
      } catch {
        // Safe fallback in restricted environments
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Modals state
  const [traceRun, setTraceRun] = useState<TestRun | null>(null);
  const [investigateRun, setInvestigateRun] = useState<TestRun | null>(null);
  const [runSuiteModalOpen, setRunSuiteModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [docsOpen, setDocsOpen] = useState<boolean>(false);

  const pendingHealingCount = healingQueue.filter((h) => h.status === 'pending').length;

  // Handler to rerun a test
  const handleRerunTest = (runId: string) => {
    setRunSuiteModalOpen(true);
  };

  // Handler to investigate and manually heal the failing run
  const handleHealFailedTest = (runId: string, healedSelector: string) => {
    setTestRuns((prev) =>
      prev.map((r) => {
        if (r.id === runId) {
          return {
            ...r,
            status: 'healed_passed',
            statusSubtitle: '1 selector recovered (Manual override)',
            healedCount: 1,
            steps: r.steps.map((st) => {
              if (st.status === 'failed') {
                return {
                  ...st,
                  status: 'healed',
                  healedLocator: healedSelector,
                  matchScore: 64,
                  matchReason: 'Manually verified and confirmed by QA Lead Elena Rostova',
                  interventionMs: 18,
                };
              }
              return st;
            }),
          };
        }
        return r;
      })
    );

    // Update metrics: 100% pass rate, 3 healed locators, 0 failing locators
    setMetrics((prev) => ({
      ...prev,
      successRate: 100.0,
      healsBoost: 50.0,
      selfHealedCount: prev.selfHealedCount + 1,
      failingCount: 0,
    }));

    // Update healing queue item
    setHealingQueue((prev) =>
      prev.map((item) => (item.id === 'heal-3' ? { ...item, status: 'approved' } : item))
    );
  };

  // Handler for approving a heal in Healing Queue
  const handleApproveHealingItem = (id: string) => {
    setHealingQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
  };

  // Handler for rejecting a heal
  const handleRejectHealingItem = (id: string) => {
    setHealingQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
  };

  // 1. SIGN IN PAGE (/signin)
  if (route === 'signin') {
    return (
      <SignInPage
        onNavigateSignUp={() => navigateTo('signup')}
        onNavigateForgotPassword={() => navigateTo('forgot-password')}
        onNavigateHome={() => navigateTo('landing')}
        onLoginSuccess={() => navigateTo('app', 'projects')}
      />
    );
  }

  // 2. SIGN UP PAGE (/signup)
  if (route === 'signup') {
    return (
      <SignUpPage
        onNavigateSignIn={() => navigateTo('signin')}
        onNavigateHome={() => navigateTo('landing')}
        onSignUpSuccess={() => navigateTo('app', 'projects')}
      />
    );
  }

  // 3. FORGOT PASSWORD PAGE (/forgot-password)
  if (route === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateSignIn={() => navigateTo('signin')}
        onNavigateHome={() => navigateTo('landing')}
        onLaunchDemoConsole={() => navigateTo('app', 'projects')}
      />
    );
  }

  // 4. LANDING PAGE (Root /)
  if (route === 'landing') {
    return (
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
        <LandingPage
          onLaunchConsole={(tab) => navigateTo('app', tab || 'projects')}
          onRunDemoSuite={() => {
            navigateTo('app', 'projects');
            setRunSuiteModalOpen(true);
          }}
          onNavigateToAuth={(authPage) => navigateTo(authPage)}
        />

        {runSuiteModalOpen && (
          <RunSuiteModal
            onClose={() => setRunSuiteModalOpen(false)}
            onComplete={() => {}}
          />
        )}
      </div>
    );
  }

  // 5. APP VIEW: Full GhostRunner application console (/app)
  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoToLanding={() => navigateTo('landing')}
        onSignOut={() => navigateTo('signin')}
        healingCount={pendingHealingCount}
        onOpenDocs={() => setDocsOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container shifted right by 256px on desktop */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          selectedSuite={selectedSuite}
          onSelectSuite={setSelectedSuite}
          selectedEnv={selectedEnv}
          onSelectEnv={setSelectedEnv}
          engineActive={engineActive}
          onToggleEngine={() => setEngineActive(!engineActive)}
          onOpenDocs={() => setDocsOpen(true)}
          onSignOut={() => navigateTo('signin')}
        />

        {/* Content Area */}
        <main className="relative pt-14 bg-surface min-h-[calc(100vh-3.5rem)] flex-1">
          <div className="flex flex-col w-full">
            <div className="px-space-md sm:px-space-lg lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
              {/* TAB: Projects / Connect Project */}
              {currentTab === 'projects' && (
                <ConnectProjectView
                  onOpenTestFlow={(projectName) => {
                    setCurrentTab('test-runs');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectProjectSuite={(suiteName) => {
                    setSelectedSuite(suiteName);
                  }}
                />
              )}

              {/* TAB: Test Runs Screen */}
              {currentTab === 'test-runs' && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-space-sm flex-wrap">
                        <h1 className="font-headline-lg text-headline-lg text-text-primary">
                          Test Runs
                        </h1>
                      </div>
                      <p className="font-body-md text-body-md text-text-secondary">
                        History of automated test executions, error stack traces, and dynamic locator recovery.
                      </p>
                    </div>

                    <div className="flex items-center gap-space-sm self-start md:self-auto flex-wrap">
                      <button
                        onClick={() => setExportModalOpen(true)}
                        className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-xl bg-surface-canvas shadow-sm text-text-primary hover:bg-surface-subtle transition-colors font-label-md text-label-md border border-border-subtle cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] text-text-secondary">
                          download
                        </span>
                        <span>Export Report (JUnit / JSON)</span>
                      </button>

                      <button
                        onClick={() => setRunSuiteModalOpen(true)}
                        className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-xl bg-primary-container text-on-primary shadow-sm hover:opacity-95 transition-all font-label-md text-label-md font-semibold cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        <span>Run Test Suite</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetry Cards Strip */}
                  <TelemetryCards metrics={metrics} />

                  {/* Interactive Runs Table */}
                  <TestRunsTable
                    testRuns={testRuns}
                    onRerunTest={handleRerunTest}
                    onOpenTrace={(run) => setTraceRun(run)}
                    onViewInHealingQueue={(spec) => setCurrentTab('healing-queue')}
                    onInvestigate={(run) => setInvestigateRun(run)}
                    selectedEnv={selectedEnv}
                  />
                </>
              )}

              {/* TAB: Healing Queue */}
              {currentTab === 'healing-queue' && (
                <HealingQueueView
                  items={healingQueue}
                  onApproveItem={handleApproveHealingItem}
                  onRejectItem={handleRejectHealingItem}
                  onOpenTestRuns={() => setCurrentTab('test-runs')}
                />
              )}

              {/* TAB: Dashboard */}
              {currentTab === 'dashboard' && (
                <DashboardView
                  metrics={metrics}
                  onOpenRuns={() => setCurrentTab('test-runs')}
                  onOpenHealingQueue={() => setCurrentTab('healing-queue')}
                />
              )}

              {/* TAB: Settings */}
              {currentTab === 'settings' && (
                <SettingsView
                  engineActive={engineActive}
                  onToggleEngine={() => setEngineActive(!engineActive)}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals & Drawers */}
      {traceRun && (
        <TraceViewerModal run={traceRun} onClose={() => setTraceRun(null)} />
      )}

      {runSuiteModalOpen && (
        <RunSuiteModal
          onClose={() => setRunSuiteModalOpen(false)}
          onComplete={() => {}}
        />
      )}

      {exportModalOpen && (
        <ExportReportModal
          testRuns={testRuns}
          onClose={() => setExportModalOpen(false)}
        />
      )}

      {investigateRun && (
        <InvestigateModal
          run={investigateRun}
          onClose={() => setInvestigateRun(null)}
          onHealTest={handleHealFailedTest}
        />
      )}

      {docsOpen && <DocsDrawer onClose={() => setDocsOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
