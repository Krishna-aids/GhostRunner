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
import { MascotWidget } from './components/MascotWidget';
import { ThemeProvider } from './context/ThemeContext';
import { INITIAL_METRICS, INITIAL_TEST_RUNS, INITIAL_HEALING_QUEUE } from './data/mockData';
import { TestRun, HealingQueueItem, MetricSummary } from './types';

// GhostRunner 5-page Specification Page Components
import { ProjectsPage } from './components/pages/ProjectsPage';
import { ProjectDetailPage } from './components/pages/ProjectDetailPage';
import { TestDetailPage } from './components/pages/TestDetailPage';
import { RunDetailPage } from './components/pages/RunDetailPage';

export type AppRoute =
  | 'landing'
  | 'signin'
  | 'signup'
  | 'forgot-password'
  | 'projects'
  | 'project-detail'
  | 'test-detail'
  | 'run-detail'
  | 'app';

interface RouteState {
  route: AppRoute;
  projectId?: string;
  testId?: string;
  runId?: string;
}

function parseBrowserRoute(): RouteState {
  if (typeof window === 'undefined') return { route: 'landing' };
  const path = window.location.pathname;
  const lowerPath = path.toLowerCase();

  if (
    lowerPath === '/login' ||
    lowerPath.startsWith('/login') ||
    lowerPath === '/signin' ||
    lowerPath.startsWith('/signin')
  ) {
    return { route: 'signin' };
  }
  if (lowerPath === '/signup' || lowerPath.startsWith('/signup')) {
    return { route: 'signup' };
  }
  if (lowerPath === '/forgot-password' || lowerPath.startsWith('/forgot-password')) {
    return { route: 'forgot-password' };
  }

  // /projects/:id
  const projectDetailMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectDetailMatch) {
    return { route: 'project-detail', projectId: projectDetailMatch[1] };
  }

  // /projects
  if (lowerPath === '/projects' || lowerPath === '/projects/') {
    return { route: 'projects' };
  }

  // /tests/:id
  const testDetailMatch = path.match(/^\/tests\/([^/]+)$/);
  if (testDetailMatch) {
    return { route: 'test-detail', testId: testDetailMatch[1] };
  }

  // /runs/:id
  const runDetailMatch = path.match(/^\/runs\/([^/]+)$/);
  if (runDetailMatch) {
    return { route: 'run-detail', runId: runDetailMatch[1] };
  }

  if (lowerPath === '/app' || lowerPath === '/dashboard' || lowerPath === '/console') {
    return { route: 'app' };
  }

  return { route: 'landing' };
}

function AppContent() {
  const initialParsed = parseBrowserRoute();

  const [route, setRoute] = useState<AppRoute>(initialParsed.route);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialParsed.projectId || 'proj-ecom-checkout'
  );
  const [selectedTestId, setSelectedTestId] = useState<string>(
    initialParsed.testId || 'test-checkout-flow'
  );
  const [selectedRunId, setSelectedRunId] = useState<string>(
    initialParsed.runId || 'run-demo-2'
  );

  const getInitialTab = (): AppTab => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'projects', 'test-runs', 'healing-queue', 'settings'].includes(tabParam)) {
        return tabParam as AppTab;
      }
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'projects', 'test-runs', 'healing-queue', 'settings'].includes(hash)) {
        return hash as AppTab;
      }
    }
    return 'projects';
  };

  // App internal tab navigation (Dashboard, Projects, Test Runs, Healing Queue, Settings)
  const [currentTab, setCurrentTab] = useState<AppTab>(getInitialTab);
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
      const parsed = parseBrowserRoute();
      setRoute(parsed.route);
      if (parsed.projectId) setSelectedProjectId(parsed.projectId);
      if (parsed.testId) setSelectedTestId(parsed.testId);
      if (parsed.runId) setSelectedRunId(parsed.runId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (
    newRoute: AppRoute,
    options?: {
      id?: string;
      tab?: AppTab;
    }
  ) => {
    if (options?.tab) {
      setCurrentTab(options.tab);
    }

    let path = '/';
    if (newRoute === 'signin') path = '/login';
    else if (newRoute === 'signup') path = '/signup';
    else if (newRoute === 'forgot-password') path = '/forgot-password';
    else if (newRoute === 'projects') path = '/projects';
    else if (newRoute === 'project-detail') {
      const pId = options?.id || selectedProjectId || 'proj-ecom-checkout';
      setSelectedProjectId(pId);
      path = `/projects/${pId}`;
    } else if (newRoute === 'test-detail') {
      const tId = options?.id || selectedTestId || 'test-checkout-flow';
      setSelectedTestId(tId);
      path = `/tests/${tId}`;
    } else if (newRoute === 'run-detail') {
      const rId = options?.id || selectedRunId || 'run-demo-2';
      setSelectedRunId(rId);
      path = `/runs/${rId}`;
    } else if (newRoute === 'app') {
      path = '/app';
    }

    setRoute(newRoute);

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
  const handleRerunTest = (_runId: string) => {
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

  // 1. SIGN IN / LOGIN PAGE (/login, /signin)
  if (route === 'signin') {
    return (
      <>
        <SignInPage
          onNavigateSignUp={() => navigateTo('signup')}
          onNavigateForgotPassword={() => navigateTo('forgot-password')}
          onNavigateHome={() => navigateTo('landing')}
          onLoginSuccess={() => navigateTo('projects')}
        />
        <MascotWidget onInteract={() => {}} />
      </>
    );
  }

  // 2. SIGN UP PAGE (/signup)
  if (route === 'signup') {
    return (
      <>
        <SignUpPage
          onNavigateSignIn={() => navigateTo('signin')}
          onNavigateHome={() => navigateTo('landing')}
          onSignUpSuccess={() => navigateTo('projects')}
        />
        <MascotWidget onInteract={() => {}} />
      </>
    );
  }

  // 3. FORGOT PASSWORD PAGE (/forgot-password)
  if (route === 'forgot-password') {
    return (
      <ForgotPasswordPage
        onNavigateSignIn={() => navigateTo('signin')}
        onNavigateHome={() => navigateTo('landing')}
        onLaunchDemoConsole={() => navigateTo('projects')}
      />
    );
  }

  // 4. LANDING PAGE (Root /)
  if (route === 'landing') {
    return (
      <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
        <LandingPage
          onLaunchConsole={(tab) => {
            if (tab === 'projects') {
              navigateTo('projects');
            } else {
              navigateTo('app', { tab: tab || 'projects' });
            }
          }}
          onRunDemoSuite={() => {
            navigateTo('projects');
            setRunSuiteModalOpen(true);
          }}
          onNavigateToAuth={(authPage) => navigateTo(authPage)}
        />

        <MascotWidget onInteract={() => {}} />

        {runSuiteModalOpen && (
          <RunSuiteModal
            onClose={() => setRunSuiteModalOpen(false)}
            onComplete={() => {}}
          />
        )}
      </div>
    );
  }

  // 5. AUTHENTICATED CONSOLE VIEW (/projects, /projects/:id, /tests/:id, /runs/:id, /app)
  const isSpecRoute = ['projects', 'project-detail', 'test-detail', 'run-detail'].includes(route);
  const activeSidebarTab: AppTab = isSpecRoute ? 'projects' : currentTab;

  return (
    <div className="min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased flex flex-col">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={activeSidebarTab}
        onSelectTab={(tab) => {
          if (tab === 'projects') {
            navigateTo('projects');
          } else {
            setCurrentTab(tab);
            navigateTo('app', { tab });
          }
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
              {/* SPEC ROUTE 2: /projects (Projects List + Create Project) */}
              {route === 'projects' && (
                <ProjectsPage
                  onOpenProject={(pId) => navigateTo('project-detail', { id: pId })}
                  onSwitchToImportView={() => {
                    setCurrentTab('projects');
                    setRoute('app');
                  }}
                />
              )}

              {/* SPEC ROUTE 3: /projects/:id (Project Detail + Repo Connect + Tests List) */}
              {route === 'project-detail' && (
                <ProjectDetailPage
                  projectId={selectedProjectId}
                  onBackToProjects={() => navigateTo('projects')}
                  onOpenTest={(tId) => navigateTo('test-detail', { id: tId })}
                />
              )}

              {/* SPEC ROUTE 4: /tests/:id (Test Detail + Live Run Stepper + Run History) */}
              {route === 'test-detail' && (
                <TestDetailPage
                  testId={selectedTestId}
                  onBackToProject={(pId) => navigateTo('project-detail', { id: pId })}
                  onOpenRun={(rId) => navigateTo('run-detail', { id: rId })}
                />
              )}

              {/* SPEC ROUTE 5: /runs/:id (Run Detail + Evidence Gallery + Self-Healing Approval) */}
              {route === 'run-detail' && (
                <RunDetailPage
                  runId={selectedRunId}
                  onBackToTest={(tId) => navigateTo('test-detail', { id: tId })}
                  onRerunSuccess={() => {}}
                />
              )}

              {/* EXISTING TABS (/app): ConnectProject, Test Runs, Healing Queue, Dashboard, Settings */}
              {route === 'app' && (
                <>
                  {currentTab === 'projects' && (
                    <ConnectProjectView
                      onOpenTestFlow={(_projectName) => {
                        setCurrentTab('test-runs');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onSelectProjectSuite={(suiteName) => {
                        setSelectedSuite(suiteName);
                      }}
                    />
                  )}

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
                        onViewInHealingQueue={(_spec) => setCurrentTab('healing-queue')}
                        onInvestigate={(run) => setInvestigateRun(run)}
                        selectedEnv={selectedEnv}
                      />
                    </>
                  )}

                  {currentTab === 'healing-queue' && (
                    <HealingQueueView
                      items={healingQueue}
                      onApproveItem={handleApproveHealingItem}
                      onRejectItem={handleRejectHealingItem}
                      onOpenTestRuns={() => setCurrentTab('test-runs')}
                    />
                  )}

                  {currentTab === 'dashboard' && (
                    <DashboardView
                      metrics={metrics}
                      onOpenRuns={() => setCurrentTab('test-runs')}
                      onOpenHealingQueue={() => setCurrentTab('healing-queue')}
                    />
                  )}

                  {currentTab === 'settings' && (
                    <SettingsView
                      engineActive={engineActive}
                      onToggleEngine={() => setEngineActive(!engineActive)}
                    />
                  )}
                </>
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

      {/* Global Right-side Ghost Mascot Launcher with Hover Disappear & Popup Chat */}
      <MascotWidget />
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
