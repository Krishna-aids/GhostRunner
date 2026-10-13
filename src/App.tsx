/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import { isSupabaseConfigured } from './services/supabaseClient';
import * as db from './services/supabaseDataService';
import { INITIAL_METRICS, INITIAL_TEST_RUNS, INITIAL_HEALING_QUEUE } from './data/mockData';
import { TestRun, HealingQueueItem, MetricSummary } from './types';

// GhostRunner 5-page Specification Page Components
import { ProjectsPage } from './components/pages/ProjectsPage';
import { ProjectDetailPage } from './components/pages/ProjectDetailPage';
import { TestDetailPage } from './components/pages/TestDetailPage';
import { RunDetailPage } from './components/pages/RunDetailPage';
import { InteractiveDemoLab } from './components/pages/InteractiveDemoLab';
import { handleOAuthCallback } from './services/githubService';

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
  const { user, signOut: authSignOut, enterDemoMode } = useAuth();

  const [route, setRoute] = useState<AppRoute>(initialParsed.route);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialParsed.projectId || 'proj-ecom-checkout'
  );
  const [selectedTestId, setSelectedTestId] = useState<string>(
    initialParsed.testId || 'test-checkout-flow'
  );
  const [selectedRunId, setSelectedRunId] = useState<string>(
    initialParsed.runId || 'run-102'
  );

  // ── Handle GitHub OAuth callback at root level ───────────────────────────
  // Runs once on mount. Captures github_token + github_user from URL query params
  // immediately, regardless of which component is currently mounted. This prevents
  // the token from being lost when the user lands on /app after GitHub redirects.
  useEffect(() => {
    const oauthResult = handleOAuthCallback();
    if (oauthResult) {
      // Restore the project context the user was on before the OAuth redirect
      const savedProjectId = localStorage.getItem('github_oauth_return_project');
      if (savedProjectId) {
        localStorage.removeItem('github_oauth_return_project');
        setSelectedProjectId(savedProjectId);
        setRoute('project-detail');
        try {
          window.history.replaceState({}, '', `/projects/${savedProjectId}`);
        } catch {}
        return;
      }
      // No saved project — just go to projects list
      setRoute('projects');
      try {
        window.history.replaceState({}, '', '/projects');
      } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If user is authenticated and navigating to login/signup, redirect to projects automatically
  useEffect(() => {
    if (user && (route === 'signin' || route === 'signup')) {
      navigateTo('projects');
    }
  }, [user, route]);

  const handleSignOut = async () => {
    await authSignOut();
    navigateTo('signin');
  };

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
  const [testRuns, setTestRuns] = useState<TestRun[]>(() => {
    try {
      const saved = localStorage.getItem('ghostrunner_test_runs');
      return saved ? JSON.parse(saved) : INITIAL_TEST_RUNS;
    } catch {
      return INITIAL_TEST_RUNS;
    }
  });
  const [healingQueue, setHealingQueue] = useState<HealingQueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('ghostrunner_healing_queue');
      return saved ? JSON.parse(saved) : INITIAL_HEALING_QUEUE;
    } catch {
      return INITIAL_HEALING_QUEUE;
    }
  });
  const [metrics, setMetrics] = useState<MetricSummary>(() => {
    try {
      const saved = localStorage.getItem('ghostrunner_metrics');
      return saved ? JSON.parse(saved) : INITIAL_METRICS;
    } catch {
      return INITIAL_METRICS;
    }
  });
  const [engineActive, setEngineActive] = useState<boolean>(true);
  const [selectedSuite, setSelectedSuite] = useState<string>('checkout-suite');
  const [selectedEnv, setSelectedEnv] = useState<string>('Staging v2.18');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Sync test runs, healing queue, and metrics to localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('ghostrunner_test_runs', JSON.stringify(testRuns));
    } catch {}
  }, [testRuns]);

  useEffect(() => {
    try {
      localStorage.setItem('ghostrunner_healing_queue', JSON.stringify(healingQueue));
    } catch {}
  }, [healingQueue]);

  useEffect(() => {
    try {
      localStorage.setItem('ghostrunner_metrics', JSON.stringify(metrics));
    } catch {}
  }, [metrics]);

  // ── Load real Supabase data when authenticated ────────────────────────────
  const loadSupabaseData = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    try {
      // Fetch live test runs for the authenticated user
      const runs = await db.fetchAllRunsForOwner(user.id, 50);
      if (runs.length > 0) {
        // Map domain TestRun to the legacy UI TestRun shape so existing components still work
        const mappedRuns: TestRun[] = runs.map((r) => ({
          id: r.id,
          specFile: r.test_definition_id || 'unknown.spec.ts',
          description: r.summary || 'Test execution',
          branch: r.environment_ref || 'main',
          timeAgo: r.started_at
            ? (() => {
                const diff = Date.now() - new Date(r.started_at).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return 'Just now';
                if (mins < 60) return `${mins}m ago`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h ago`;
                return `${Math.floor(hrs / 24)}d ago`;
              })()
            : 'Unknown',
          duration: r.duration || (r.duration_ms ? `${Math.round(r.duration_ms / 1000)}s` : '—'),
          status: (r.status as 'passed' | 'failed' | 'healed_passed' | 'running') ?? 'passed',
          statusSubtitle:
            r.status === 'passed'
              ? 'Clean run (0 interventions)'
              : r.status === 'failed'
              ? `${r.classification || 'Test failed'} (${r.confidence ?? 0}% conf)`
              : r.summary || r.status,
          healedCount: r.status === 'repair_proposed' || r.status === 'rerunning' ? 1 : 0,
          steps: [],
          consoleLogs: r.summary ? [r.summary] : [],
        }));
        setTestRuns(mappedRuns);

        // Compute live metrics from runs
        const total = runs.length;
        const passed = runs.filter((r) => r.status === 'passed').length;
        const healed = runs.filter((r) => r.status === 'repair_proposed' || r.status === 'rerunning').length;
        const failed = runs.filter((r) => r.status === 'failed').length;
        const confVals = runs.map((r) => r.confidence).filter((c) => c != null) as number[];
        const avgConf = confVals.length
          ? Math.round(confVals.reduce((a, b) => a + b, 0) / confVals.length)
          : 0;
        const successRate = total > 0 ? Math.round(((passed + healed) / total) * 1000) / 10 : INITIAL_METRICS.successRate;
        const rawRate = total > 0 ? Math.round((passed / total) * 1000) / 10 : 0;
        setMetrics({
          successRate,
          healsBoost: Math.max(0, successRate - rawRate),
          selfHealedCount: healed,
          avgConfidence: avgConf || INITIAL_METRICS.avgConfidence,
          totalDuration: INITIAL_METRICS.totalDuration,
          threads: INITIAL_METRICS.threads,
          failingCount: failed,
        });
      }
    } catch (err) {
      console.warn('[GhostRunner] Using local persistent store for dashboard data.', err);
    }
  }, [user]);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

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
      const rId = options?.id || selectedRunId || 'run-102';
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
          onLoginSuccess={() => {
            if (!user) enterDemoMode();
            navigateTo('projects');
          }}
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
          onSignUpSuccess={() => {
            if (!user) enterDemoMode();
            navigateTo('projects');
          }}
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
          onRunSampleSuite={() => {
            navigateTo('projects');
            setRunSuiteModalOpen(true);
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
        onSignOut={handleSignOut}
        healingCount={pendingHealingCount}
        onOpenDocs={() => setDocsOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        currentUser={user}
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
          onSignOut={handleSignOut}
          currentUser={user}
        />

        {/* Content Area */}
        <main className="relative pt-14 bg-surface min-h-[calc(100vh-3.5rem)] flex-1">
          <div className="flex flex-col w-full">
            <div className="px-space-md sm:px-space-lg lg:px-margin-desktop py-space-xl flex flex-col gap-space-lg">
              {/* SPEC ROUTE 2: /projects (Projects List + Create Project) */}
              {route === 'projects' && (
                <ProjectsPage
                  ownerId={user?.id}
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
                  ownerId={user?.id}
                  onBackToProjects={() => navigateTo('projects')}
                  onOpenTest={(tId) => navigateTo('test-detail', { id: tId })}
                />
              )}

              {/* SPEC ROUTE 4: /tests/:id (Test Detail + Live Run Stepper + Run History) */}
              {route === 'test-detail' && (
                <TestDetailPage
                  testId={selectedTestId}
                  ownerId={user?.id}
                  onBackToProject={(pId) => navigateTo('project-detail', { id: pId })}
                  onOpenRun={(rId) => navigateTo('run-detail', { id: rId })}
                />
              )}

              {/* SPEC ROUTE 5: /runs/:id (Run Detail + Evidence Gallery + Self-Healing Approval) */}
              {route === 'run-detail' && (
                <RunDetailPage
                  runId={selectedRunId}
                  ownerId={user?.id}
                  onBackToTest={(tId) => navigateTo('test-detail', { id: tId })}
                  onRerunSuccess={() => {}}
                />
              )}

              {/* EXISTING TABS (/app): ConnectProject, Test Runs, Healing Queue, Dashboard, Settings */}
              {route === 'app' && (
                <>
                  {currentTab === 'demo-lab' && (
                    <InteractiveDemoLab />
                  )}

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
                      ownerId={user?.id}
                      onOpenRun={(runId, testDefId) => {
                        // Navigate to the run's URL so full RunDetailPage loads
                        const path = testDefId
                          ? `/tests/${testDefId}/runs/${runId}`
                          : `/runs/${runId}`;
                        window.location.href = path;
                      }}
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
