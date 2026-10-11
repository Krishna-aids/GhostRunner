import React, { useState, useRef, useEffect } from 'react';
import { ProjectItem, AnalysisStep, GitHubRepoItem } from '../types';
import { INITIAL_PROJECTS } from '../data/mockData';
import {
  initiateGitHubOAuth,
  handleOAuthCallback,
  getStoredGitHubAuth,
  clearGitHubAuth,
  fetchGitHubRepos,
  formatRelativeTime,
  type GitHubRepo,
} from '../services/githubService';

interface ConnectProjectViewProps {
  onOpenTestFlow: (projectName?: string) => void;
  onSelectProjectSuite: (suiteName: string) => void;
}

export const ConnectProjectView: React.FC<ConnectProjectViewProps> = ({
  onOpenTestFlow,
  onSelectProjectSuite,
}) => {
  // Projects state
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [projectSearch, setProjectSearch] = useState('');

  // Flow stages: 'idle' | 'github_select' | 'zip_uploading' | 'analyzing' | 'analysis_complete'
  const [activeStage, setActiveStage] = useState<
    'idle' | 'github_select' | 'zip_uploading' | 'analyzing' | 'analysis_complete'
  >('idle');

  // Git provider: 'github' | 'gitlab' | 'bitbucket'
  const [gitProvider, setGitProvider] = useState<'github' | 'gitlab' | 'bitbucket'>('github');
  const [isGitConnected, setIsGitConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string>('');
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  // GitHub App installation_id — captured from OAuth redirect URL
  const [githubInstallationId, setGithubInstallationId] = useState<string>('');

  // Check for existing GitHub auth or OAuth callback on mount
  useEffect(() => {
    // First check if we're returning from OAuth (installation redirect)
    const oauthResult = handleOAuthCallback();
    if (oauthResult) {
      setIsGitConnected(true);
      setGithubUsername(oauthResult.username);
      setActiveStage('github_select');
      loadGitHubRepos(oauthResult.token);

      // Capture installation_id from redirect URL params
      const urlParams = new URLSearchParams(window.location.search);
      const installId = urlParams.get('installation_id');
      if (installId) {
        setGithubInstallationId(installId);
        sessionStorage.setItem('github_installation_id', installId);
      }
      return;
    }

    // Check for existing stored auth
    const stored = getStoredGitHubAuth();
    if (stored) {
      setIsGitConnected(true);
      setGithubUsername(stored.username);
      // Restore stored installation_id
      const storedInstallId = sessionStorage.getItem('github_installation_id');
      if (storedInstallId) setGithubInstallationId(storedInstallId);
    }
  }, []);

  // Load repos from GitHub API
  const loadGitHubRepos = async (token: string) => {
    setReposLoading(true);
    setReposError('');
    try {
      const repos = await fetchGitHubRepos(token);
      setGithubRepos(repos);
      if (repos.length > 0) {
        setSelectedRepoId(repos[0].id.toString());
      }
    } catch (err) {
      setReposError(err instanceof Error ? err.message : 'Failed to fetch repositories');
    } finally {
      setReposLoading(false);
    }
  };

  // Convert GitHub API repo to our internal GitHubRepoItem type
  const mapGitHubRepoToItem = (repo: GitHubRepo): GitHubRepoItem => ({
    id: repo.id.toString(),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    updatedAt: formatRelativeTime(repo.updated_at),
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count,
    detectedFrameworkHint: repo.language === 'TypeScript' || repo.language === 'JavaScript'
      ? 'Possible Playwright/Cypress'
      : repo.language === 'Python'
      ? 'Possible pytest'
      : 'Scan required',
  });

  // Filtered repositories — search through real GitHub repos
  const filteredRepos = githubRepos
    .map(mapGitHubRepoToItem)
    .filter(
      (r) =>
        r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
        r.fullName.toLowerCase().includes(repoSearch.toLowerCase()) ||
        r.language.toLowerCase().includes(repoSearch.toLowerCase())
    );

  // Trigger GitHub OAuth flow
  const handleStartGitHubConnect = () => {
    const stored = getStoredGitHubAuth();
    if (stored) {
      // Already authenticated, go straight to repo selection
      setIsGitConnected(true);
      setGithubUsername(stored.username);
      setActiveStage('github_select');
      loadGitHubRepos(stored.token);
    } else {
      // Redirect to GitHub OAuth
      initiateGitHubOAuth();
    }
  };

  // ZIP Upload state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    progress: number;
    error?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active project being created / analyzed
  const [currentProject, setCurrentProject] = useState<{
    name: string;
    source: 'github' | 'gitlab' | 'bitbucket' | 'zip';
    repoName?: string;
    language: string;
    framework: string;
  }>({
    name: '',
    source: 'github',
    repoName: '',
    language: 'TypeScript',
    framework: 'Playwright',
  });

  // Analysis steps simulation state
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { stepNumber: 1, title: 'Import Project', description: 'Retrieve selected repository or unpack uploaded ZIP archive safely.', status: 'pending' },
    { stepNumber: 2, title: 'Analyze Repository', description: 'Inspect directory structure and identify source code and config files.', status: 'pending' },
    { stepNumber: 3, title: 'Detect Testing Framework', description: 'Identify supported testing frameworks (Playwright, Cypress, Selenium).', status: 'pending' },
    { stepNumber: 4, title: 'Prepare Test Environment', description: 'Verify setup requirements and locate test configuration files.', status: 'pending' },
    { stepNumber: 5, title: 'Ready to Create Test Flow', description: 'Summarize analysis and prepare dynamic self-healing hooks.', status: 'pending' },
  ]);

  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const recentTableRef = useRef<HTMLDivElement>(null);

  // Context menu for a project
  const [menuOpenProjectId, setMenuOpenProjectId] = useState<string | null>(null);

  // Filtered projects
  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.detectedFramework.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (p.repoFullName && p.repoFullName.toLowerCase().includes(projectSearch.toLowerCase()))
  );

  // Confirm repository selection & start analysis
  const handleConfirmRepository = () => {
    const chosenRepo = filteredRepos.find((r) => r.id === selectedRepoId);
    if (!chosenRepo) return;

    setCurrentProject({
      name: chosenRepo.name,
      source: gitProvider,
      repoName: chosenRepo.fullName,
      language: chosenRepo.language,
      framework: chosenRepo.detectedFrameworkHint.includes('Playwright')
        ? 'Playwright'
        : chosenRepo.detectedFrameworkHint.includes('Cypress')
        ? 'Cypress'
        : 'Scan pending',
    });

    startAnalysisSequence(chosenRepo.name);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Process file (with validation)
  const processSelectedFile = (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        progress: 0,
        error: 'Invalid file format. Please upload a .zip archive.',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        progress: 0,
        error: 'File exceeds 50MB limit. Please exclude node_modules or build artifacts.',
      });
      return;
    }

    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setUploadedFile({
      name: file.name,
      size: sizeStr,
      progress: 0,
    });
    setActiveStage('zip_uploading');

    // Simulate upload progress
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      if (p <= 100) {
        setUploadedFile((prev) => (prev ? { ...prev, progress: p } : null));
      } else {
        clearInterval(interval);
      }
    }, 200);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Confirm ZIP upload & start analysis
  const handleConfirmZipUpload = () => {
    if (!uploadedFile) return;
    const cleanName = uploadedFile.name.replace('.zip', '');
    setCurrentProject({
      name: cleanName,
      source: 'zip',
      language: 'TypeScript / React',
      framework: 'Playwright',
    });

    startAnalysisSequence(cleanName);
  };

  // Run the 5-step analysis simulation
  const startAnalysisSequence = (projectName: string) => {
    setActiveStage('analyzing');
    setAnalysisProgress(10);

    // Reset steps
    setAnalysisSteps([
      {
        stepNumber: 1,
        title: 'Import Project',
        description: 'Retrieve selected repository or unpack uploaded ZIP archive safely.',
        status: 'in_progress',
        detail: 'Connecting to origin and verifying read permissions...',
      },
      {
        stepNumber: 2,
        title: 'Analyze Repository',
        description: 'Inspect directory structure and identify source code and config files.',
        status: 'pending',
      },
      {
        stepNumber: 3,
        title: 'Detect Testing Framework',
        description: 'Identify supported testing frameworks (Playwright, Cypress, Selenium).',
        status: 'pending',
      },
      {
        stepNumber: 4,
        title: 'Prepare Test Environment',
        description: 'Verify setup requirements and locate test configuration files.',
        status: 'pending',
      },
      {
        stepNumber: 5,
        title: 'Ready to Create Test Flow',
        description: 'Summarize analysis and prepare dynamic self-healing hooks.',
        status: 'pending',
      },
    ]);

    // Stage 1 -> Step 2
    setTimeout(() => {
      setAnalysisProgress(35);
      setAnalysisSteps((prev) =>
        prev.map((s) => {
          if (s.stepNumber === 1)
            return { ...s, status: 'completed', detail: 'Project source securely extracted (142 files).' };
          if (s.stepNumber === 2)
            return {
              ...s,
              status: 'in_progress',
              detail: 'Scanning package.json, tsconfig.json, and source manifests...',
            };
          return s;
        })
      );
    }, 1100);

    // Step 2 -> Step 3
    setTimeout(() => {
      setAnalysisProgress(60);
      setAnalysisSteps((prev) =>
        prev.map((s) => {
          if (s.stepNumber === 2)
            return {
              ...s,
              status: 'completed',
              detail: 'Repository tree identified: Next.js 14 frontend + Node.js backend.',
            };
          if (s.stepNumber === 3)
            return {
              ...s,
              status: 'in_progress',
              detail: 'Located playwright.config.ts and 24 E2E spec files.',
            };
          return s;
        })
      );
    }, 2200);

    // Step 3 -> Step 4
    setTimeout(() => {
      setAnalysisProgress(85);
      setAnalysisSteps((prev) =>
        prev.map((s) => {
          if (s.stepNumber === 3)
            return {
              ...s,
              status: 'completed',
              detail: 'Detected Playwright v1.42 (Chromium, Firefox, WebKit engines).',
            };
          if (s.stepNumber === 4)
            return {
              ...s,
              status: 'in_progress',
              detail: 'Checking browser binaries & proxy hook compatibility...',
            };
          return s;
        })
      );
    }, 3200);

    // Step 4 -> Step 5 Complete
    setTimeout(() => {
      setAnalysisProgress(100);
      setAnalysisSteps((prev) =>
        prev.map((s) => {
          if (s.stepNumber === 4)
            return {
              ...s,
              status: 'completed',
              detail: 'Environment verified: Zero configuration blockers.',
            };
          if (s.stepNumber === 5)
            return {
              ...s,
              status: 'completed',
              detail: 'Self-healing proxy ready to intercept Playwright locators.',
            };
          return s;
        })
      );

      // Add to recent projects (with real repo metadata including installation_id)
      const chosenRepo = filteredRepos.find((r) => r.id === selectedRepoId);
      const newProjectItem: ProjectItem = {
        id: `proj-${Date.now()}`,
        name: projectName,
        source: uploadedFile ? 'zip' : 'github',
        repoFullName: currentProject.repoName || chosenRepo?.fullName || `acme-corp/${projectName.toLowerCase()}`,
        detectedFramework: currentProject.framework || 'Playwright',
        language: currentProject.language || 'TypeScript',
        lastAnalyzed: 'Just now',
        status: 'ready',
        defaultBranch: chosenRepo?.defaultBranch || 'main',
        testCount: 24,
        filesCount: 142,
        description: 'Self-healing test suite prepared with Playwright locator hooks.',
        // Store installation_id and repo metadata for the webhook server
        repoMetadata: {
          full_name: currentProject.repoName || chosenRepo?.fullName || '',
          branch: chosenRepo?.defaultBranch || 'main',
          installation_id: githubInstallationId || sessionStorage.getItem('github_installation_id') || '',
          framework: currentProject.framework || 'Playwright',
          language: currentProject.language || 'TypeScript',
          connected: true,
          last_synced: new Date().toISOString(),
        },
      };

      setProjects((prev) => [newProjectItem, ...prev]);
      setActiveStage('analysis_complete');
    }, 4200);
  };

  const scrollToRecent = () => {
    if (recentTableRef.current) {
      recentTableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-space-lg w-full max-w-6xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-2 border-b border-border-subtle">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-headline-lg text-headline-lg text-text-primary font-bold">
            Connect Your Project
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Connect your code repository or upload your project to get started with self-healing tests.
          </p>
        </div>

        <button
          type="button"
          onClick={scrollToRecent}
          className="inline-flex items-center gap-1.5 px-space-md py-1.5 rounded-xl bg-surface-canvas shadow-xs text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors font-label-md text-label-md border border-border-subtle cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">list_alt</span>
          <span>View Projects ({projects.length})</span>
        </button>
      </div>

      {/* 2. Project Connection Workspace Panel */}
      {activeStage === 'idle' && (
        <div className="bg-surface-canvas rounded-2xl border-2 border-dashed border-border-strong/70 p-6 sm:p-10 flex flex-col items-center text-center shadow-xs">
          {/* Centered Icon */}
          <div className="w-14 h-14 rounded-2xl bg-surface-muted text-primary flex items-center justify-center mb-4 border border-border-subtle shadow-inner">
            <span className="material-symbols-outlined text-[28px]">source_environment</span>
          </div>

          <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-text-primary">
            Start a New Project
          </h2>
          <p className="font-body-md text-text-secondary max-w-lg mt-1 mb-8">
            Choose how you want to provide your application's source code. GhostRunner will analyze your structure and configure dynamic locator recovery.
          </p>

          {/* Two Connection Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-left">
            {/* Card A: Connect GitHub */}
            <div className="bg-surface-canvas rounded-2xl p-6 sm:p-7 border border-border-strong hover:border-primary transition-all duration-200 shadow-sm flex flex-col justify-between hover:shadow-md group">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
                    {/* Official GitHub Octocat SVG */}
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  </div>

                  <span className="font-code-sm text-xs px-2.5 py-0.5 rounded-full bg-status-success-subtle text-status-success font-medium border border-status-success/30">
                    Recommended
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-headline-md text-lg font-bold text-text-primary">
                    Connect GitHub
                  </h3>
                  <p className="font-body-md text-sm text-text-secondary leading-relaxed">
                    Import a repository directly from your GitHub account. Enables automated pull requests when locators heal.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleStartGitHubConnect}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold text-sm hover:opacity-95 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                  <span>Connect GitHub</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
                  <span>Also supports:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGitProvider('gitlab');
                      handleStartGitHubConnect();
                    }}
                    className="hover:text-text-primary underline cursor-pointer"
                  >
                    GitLab
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setGitProvider('bitbucket');
                      handleStartGitHubConnect();
                    }}
                    className="hover:text-text-primary underline cursor-pointer"
                  >
                    Bitbucket
                  </button>
                </div>
              </div>
            </div>

            {/* Card B: Upload Project ZIP */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`bg-surface-canvas rounded-2xl p-6 sm:p-7 border transition-all duration-200 shadow-sm flex flex-col justify-between ${
                isDragging
                  ? 'border-primary bg-primary-container/5 ring-2 ring-primary/20'
                  : 'border-border-strong hover:border-primary'
              } hover:shadow-md`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-status-healed-subtle text-status-healed flex items-center justify-center shadow-xs border border-status-healed/20">
                    <span className="material-symbols-outlined text-[24px]">folder_zip</span>
                  </div>

                  <span className="font-code-sm text-xs px-2.5 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-border-subtle">
                    Max 50MB
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-headline-md text-lg font-bold text-text-primary">
                    Upload Project ZIP
                  </h3>
                  <p className="font-body-md text-sm text-text-secondary leading-relaxed">
                    Upload a ZIP file containing your application's source code. Perfect for local dev environments and quick proof-of-concept tests.
                  </p>
                </div>

                {/* Short instructions */}
                <ul className="text-xs text-text-muted space-y-1 list-disc pl-4 mt-1">
                  <li>Upload a <code className="text-text-primary">.zip</code> containing your project.</li>
                  <li>Include source code and config files (<code className="text-text-primary">package.json</code>).</li>
                  <li>Exclude generated <code className="text-text-primary">node_modules</code> or build folders.</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-canvas border border-border-strong text-text-primary hover:bg-surface-subtle font-semibold text-sm shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">
                    upload_file
                  </span>
                  <span>Choose ZIP File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2A. GitHub Repository Selection Flow */}
      {activeStage === 'github_select' && (
        <div className="bg-surface-canvas rounded-2xl border border-border-strong p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0f172a] text-white flex items-center justify-center">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-text-primary font-bold">
                    Select a Repository to Import
                  </span>
                  <span className="font-code-sm text-xs px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                    Connected as @{githubUsername}
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  Showing repositories with access • {githubRepos.length} repos found
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStage('idle')}
              className="px-3 py-1.5 rounded-lg text-xs font-label-md text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
              search
            </span>
            <input
              type="text"
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              placeholder="Search repositories by name, language, or path..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-border-subtle focus:border-primary focus:bg-surface-canvas focus:outline-none text-sm text-text-primary transition-all font-body-md"
            />
          </div>

          {/* Loading / Error States */}
          {reposLoading && (
            <div className="p-8 text-center text-text-secondary">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Fetching your repositories from GitHub...</p>
            </div>
          )}

          {reposError && (
            <div className="p-4 rounded-xl bg-status-failure-subtle border border-status-failure/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-status-failure text-[20px]">error</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-status-failure">Failed to load repositories</span>
                <span className="text-xs text-text-secondary">{reposError}</span>
                <button type="button" onClick={() => { const stored = getStoredGitHubAuth(); if (stored) loadGitHubRepos(stored.token); }} className="mt-1 text-xs font-semibold text-primary underline text-left cursor-pointer">Retry</button>
              </div>
            </div>
          )}

          {/* Repository List */}
          <div className="border border-border-subtle rounded-xl overflow-hidden divide-y divide-border-subtle max-h-80 overflow-y-auto">
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepoId === repo.id;

              return (
                <div
                  key={repo.id}
                  onClick={() => setSelectedRepoId(repo.id)}
                  className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-container/10 border-l-4 border-l-primary' : 'hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      name="selectedRepo"
                      checked={isSelected}
                      onChange={() => setSelectedRepoId(repo.id)}
                      className="accent-primary cursor-pointer shrink-0"
                    />

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-code-md text-text-primary font-bold truncate">
                          {repo.fullName}
                        </span>
                        <span
                          className={`font-code-sm text-[10px] px-1.5 py-0.2 rounded border ${
                            repo.isPrivate
                              ? 'bg-surface-muted text-text-secondary border-border-subtle'
                              : 'bg-primary-container/10 text-primary border-primary/20'
                          }`}
                        >
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                        <span className="font-code-sm text-[11px] text-text-muted">
                          branch: <code className="text-text-primary">{repo.defaultBranch}</code>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span>{repo.language}</span>
                        <span>•</span>
                        <span>Updated {repo.updatedAt}</span>
                        <span>•</span>
                        <span className="text-status-healed font-medium">{repo.detectedFrameworkHint}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRepoId(repo.id);
                        handleConfirmRepository();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-container text-on-primary shadow-xs'
                          : 'bg-surface-canvas border border-border-strong text-text-primary hover:bg-surface-subtle'
                      }`}
                    >
                      {isSelected ? 'Import Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
            <span className="text-xs text-text-muted">
              GhostRunner only requests read access to source and pull request creation permissions.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStage('idle')}
                className="px-4 py-2 rounded-xl text-xs font-label-md text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmRepository}
                className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-semibold text-xs shadow-xs hover:opacity-95 cursor-pointer"
              >
                Continue to Analysis ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2B. ZIP Uploading & Validation State */}
      {activeStage === 'zip_uploading' && uploadedFile && (
        <div className="bg-surface-canvas rounded-2xl border border-border-strong p-6 sm:p-8 flex flex-col gap-5 shadow-sm max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-healed-subtle text-status-healed flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">folder_zip</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-text-primary font-bold">
                  {uploadedFile.error ? 'Upload Problem Detected' : 'Project ZIP Upload'}
                </span>
                <span className="text-xs text-text-muted">
                  {uploadedFile.name} ({uploadedFile.size})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setUploadedFile(null);
                setActiveStage('idle');
              }}
              className="text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {uploadedFile.error ? (
            <div className="p-4 rounded-xl bg-status-failure-subtle border border-status-failure/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-status-failure text-[20px]">error</span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-status-failure">File Validation Failed</span>
                <span className="text-xs text-text-secondary">{uploadedFile.error}</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-primary underline text-left cursor-pointer"
                >
                  Choose another file
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-label-md">
                <span className="text-text-secondary">
                  {uploadedFile.progress < 100 ? 'Unpacking archive...' : 'Ready for analysis'}
                </span>
                <span className="font-mono text-primary font-bold">{uploadedFile.progress}%</span>
              </div>

              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-container h-full transition-all duration-300"
                  style={{ width: `${uploadedFile.progress}%` }}
                ></div>
              </div>

              {uploadedFile.progress === 100 && (
                <div className="p-3 rounded-lg bg-status-success-subtle text-status-success border border-status-success/30 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>
                    Archive verified: Source structure valid. Ready to detect test frameworks.
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => {
                setUploadedFile(null);
                setActiveStage('idle');
              }}
              className="px-4 py-2 rounded-xl text-xs font-label-md text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Remove
            </button>
            <button
              type="button"
              disabled={Boolean(uploadedFile.error || uploadedFile.progress < 100)}
              onClick={handleConfirmZipUpload}
              className="px-5 py-2 rounded-xl bg-primary-container text-on-primary font-semibold text-xs shadow-xs hover:opacity-95 disabled:opacity-40 cursor-pointer"
            >
              Continue to Analysis ➔
            </button>
          </div>
        </div>
      )}

      {/* 3. Step-Based Project Analysis Flow Screen */}
      {activeStage === 'analyzing' && (
        <div className="bg-surface-canvas rounded-2xl border border-border-strong p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center animate-spin">
                <span className="material-symbols-outlined text-[22px]">sync</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-headline-sm text-text-primary font-bold">
                  Analyzing {currentProject.name}
                </h2>
                <span className="text-xs text-text-secondary">
                  GhostRunner is inspecting file trees, dependencies, and locator compatibility...
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-code-sm text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary-container/10">
                {analysisProgress}% Complete
              </span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-container h-full transition-all duration-500"
              style={{ width: `${analysisProgress}%` }}
            ></div>
          </div>

          {/* 5-Step Sequence Cards */}
          <div className="space-y-3">
            {analysisSteps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isPending = step.status === 'pending';

              return (
                <div
                  key={step.stepNumber}
                  className={`p-4 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-status-success-subtle/30 border-status-success/30'
                      : isInProgress
                      ? 'bg-primary-container/5 border-primary shadow-xs ring-1 ring-primary/20'
                      : 'bg-surface-subtle/50 border-border-subtle opacity-70'
                  }`}
                >
                  <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <div className="w-7 h-7 rounded-full bg-status-success text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      ) : isInProgress ? (
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 animate-spin">
                          <span className="material-symbols-outlined text-[16px]">sync</span>
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-surface-container text-text-muted flex items-center justify-center shrink-0 font-code-sm text-xs">
                          {step.stepNumber}
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="font-label-md text-sm font-bold text-text-primary">
                          Step {step.stepNumber} — {step.title}
                        </span>
                        <span className="text-xs text-text-secondary">{step.description}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span
                        className={`font-code-sm text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isCompleted
                            ? 'bg-status-success-subtle text-status-success border border-status-success/30'
                            : isInProgress
                            ? 'bg-primary-container text-on-primary animate-pulse'
                            : 'bg-surface-container text-text-muted'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {step.detail && (
                    <div className="mt-2.5 pt-2 border-t border-border-subtle/50 text-xs font-mono text-text-secondary pl-10">
                      &gt; {step.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Repository Analysis Results Screen */}
      {activeStage === 'analysis_complete' && (
        <div className="bg-surface-canvas rounded-2xl border border-status-success/40 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-status-success text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-xl font-bold text-text-primary">
                    {currentProject.name}
                  </h2>
                  <span className="font-code-sm text-xs px-2.5 py-0.5 rounded-full bg-status-success-subtle text-status-success font-semibold border border-status-success/30">
                    Ready for Self-Healing
                  </span>
                </div>
                <span className="text-xs text-text-secondary">
                  Source: {currentProject.source === 'zip' ? 'Uploaded ZIP Archive' : currentProject.repoName || 'GitHub'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveStage('idle')}
                className="px-3 py-1.5 rounded-xl border border-border-strong text-xs font-label-md text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                Connect Another Project
              </button>
            </div>
          </div>

          {/* Detected Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
              <span className="text-xs font-label-sm uppercase tracking-wider text-text-muted">
                Primary Language
              </span>
              <span className="font-headline-sm text-base font-bold text-text-primary mt-1">
                {currentProject.language}
              </span>
              <span className="text-[11px] text-text-muted mt-1">Strict type checking enabled</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
              <span className="text-xs font-label-sm uppercase tracking-wider text-text-muted">
                Detected Test Framework
              </span>
              <span className="font-headline-sm text-base font-bold text-status-healed mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Playwright v1.42
              </span>
              <span className="text-[11px] text-text-muted mt-1">Found 24 spec files in tests/e2e</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
              <span className="text-xs font-label-sm uppercase tracking-wider text-text-muted">
                GhostRunner Wrapper
              </span>
              <span className="font-headline-sm text-base font-bold text-status-success mt-1">
                Compatible
              </span>
              <span className="text-[11px] text-text-muted mt-1">Zero config edits required</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col justify-between">
              <span className="text-xs font-label-sm uppercase tracking-wider text-text-muted">
                Self-Healing Engine
              </span>
              <span className="font-headline-sm text-base font-bold text-primary mt-1">
                Armed (0.70 cutoff)
              </span>
              <span className="text-[11px] text-text-muted mt-1">Ready to intercept timeouts</span>
            </div>
          </div>

          {/* Directory Tree Preview Box */}
          <div className="p-4 rounded-xl bg-[#0f172a] text-slate-200 border border-slate-800 font-mono text-xs flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
                <span>Detected Repository Structure</span>
              </span>
              <span className="text-[11px]">tests/e2e specs verified</span>
            </div>

            <div className="leading-relaxed text-[11px] text-slate-300 space-y-0.5">
              <div>📁 {currentProject.name.toLowerCase()}</div>
              <div className="pl-4">├── 📁 src/ (components, checkout, cart)</div>
              <div className="pl-4 text-emerald-400 font-semibold">
                ├── 📁 tests/e2e/ (24 Playwright automated specs)
              </div>
              <div className="pl-8 text-emerald-300">├── test_checkout_flow.spec.ts</div>
              <div className="pl-8 text-emerald-300">├── test_inventory_modal.spec.ts</div>
              <div className="pl-8 text-emerald-300">└── test_pricing_table.spec.ts</div>
              <div className="pl-4 text-primary font-semibold">
                ├── 📄 playwright.config.ts (Ready for GhostRunner proxy)
              </div>
              <div className="pl-4">└── 📄 package.json</div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-canvas border border-border-strong text-text-primary text-xs font-label-md hover:bg-surface-subtle transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              <span>{showFileExplorer ? 'Hide Project Files' : 'View Project Files'}</span>
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  onSelectProjectSuite('checkout-suite');
                  onOpenTestFlow(currentProject.name);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-container text-on-primary font-semibold text-sm hover:opacity-95 shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Continue to Test Flow</span>
              </button>
            </div>
          </div>

          {/* Expandable Project Files List */}
          {showFileExplorer && (
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle text-xs flex flex-col gap-2">
              <span className="font-bold text-text-primary">Inspected Configuration Manifest:</span>
              <pre className="bg-surface-canvas p-3 rounded-lg border border-border-subtle font-mono text-[11px] text-text-secondary overflow-x-auto">
{`// playwright.config.ts (GhostRunner compatible)
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://staging.acme.corp',
    trace: 'on-first-retry',
  },
});`}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 5. Recent Projects Table */}
      <div
        ref={recentTableRef}
        className="bg-surface-canvas rounded-2xl border border-border-strong p-6 sm:p-8 flex flex-col gap-space-md shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <h3 className="font-headline-sm text-lg font-bold text-text-primary">
              Recent Projects
            </h3>
            <span className="font-code-sm text-xs px-2 py-0.5 rounded-full bg-surface-container text-text-secondary">
              {projects.length} connected
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search filter */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-text-muted">
                search
              </span>
              <input
                type="text"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-subtle border border-border-subtle text-xs text-text-primary focus:bg-surface-canvas focus:outline-none focus:border-primary font-body-md w-44 sm:w-56"
              />
            </div>

            <button
              type="button"
              onClick={() => setActiveStage('idle')}
              className="px-3 py-1.5 rounded-lg bg-surface-canvas border border-border-strong text-xs font-label-md text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer whitespace-nowrap"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Projects Table */}
        <div className="border border-border-subtle rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-sm">
            <thead>
              <tr className="bg-surface-subtle border-b border-border-subtle font-code-sm text-xs uppercase tracking-wider text-text-muted">
                <th className="p-3.5 font-semibold">Project Name</th>
                <th className="p-3.5 font-semibold">Source</th>
                <th className="p-3.5 font-semibold">Detected Framework</th>
                <th className="p-3.5 font-semibold">Last Analyzed</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-muted text-xs">
                    No matching projects found. Try a different search term.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((proj) => {
                  const isReady = proj.status === 'ready';
                  const isAnalyzing = proj.status === 'analyzing';
                  const isNeedsSetup = proj.status === 'needs_setup';

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-surface-subtle transition-colors cursor-pointer group"
                      onClick={() => {
                        onSelectProjectSuite(
                          proj.name.includes('checkout') ? 'checkout-suite' : 'inventory-suite'
                        );
                        onOpenTestFlow(proj.name);
                      }}
                    >
                      {/* Project Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {proj.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                              {proj.name}
                            </span>
                            <span className="text-[11px] text-text-muted truncate">
                              {proj.description || proj.repoFullName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="p-3.5 text-xs text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          {proj.source === 'zip' ? (
                            <span className="material-symbols-outlined text-[16px] text-status-healed">
                              folder_zip
                            </span>
                          ) : (
                            <svg className="w-4 h-4 fill-text-secondary shrink-0" viewBox="0 0 24 24">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                              />
                            </svg>
                          )}
                          <span className="truncate max-w-[140px]">
                            {proj.source === 'zip' ? 'ZIP Upload' : 'GitHub'}
                          </span>
                        </div>
                      </td>

                      {/* Detected Framework */}
                      <td className="p-3.5 text-xs">
                        <span
                          className={`font-code-sm px-2 py-0.5 rounded ${
                            proj.detectedFramework.includes('Playwright')
                              ? 'bg-status-healed-subtle text-status-healed font-medium'
                              : proj.detectedFramework.includes('Selenium')
                              ? 'bg-primary-container/10 text-primary font-medium'
                              : 'bg-surface-muted text-text-muted'
                          }`}
                        >
                          {proj.detectedFramework}
                        </span>
                      </td>

                      {/* Last Analyzed */}
                      <td className="p-3.5 text-xs text-text-secondary">
                        {proj.lastAnalyzed}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-xs">
                        {isReady && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success font-semibold border border-status-success/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                            Ready
                          </span>
                        )}
                        {isAnalyzing && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-container/10 text-primary font-semibold border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                            Analyzing
                          </span>
                        )}
                        {isNeedsSetup && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-warning-subtle text-status-warning font-semibold border border-status-warning/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                            Needs Setup
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div
                          className="relative inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProjectSuite('checkout-suite');
                              onOpenTestFlow(proj.name);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-canvas border border-border-strong text-xs font-semibold text-text-primary hover:bg-primary-container hover:text-white transition-colors cursor-pointer"
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenProjectId(
                                menuOpenProjectId === proj.id ? null : proj.id
                              )
                            }
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle cursor-pointer"
                            title="More options"
                          >
                            <span className="material-symbols-outlined text-[16px]">more_vert</span>
                          </button>

                          {/* Context menu */}
                          {menuOpenProjectId === proj.id && (
                            <div className="absolute right-0 top-8 w-44 bg-surface-canvas rounded-xl border border-border-strong shadow-lg p-1 z-30 flex flex-col text-left text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenProjectId(null);
                                  startAnalysisSequence(proj.name);
                                }}
                                className="px-3 py-1.5 rounded-lg hover:bg-surface-subtle text-text-primary flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">refresh</span>
                                <span>Re-analyze</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenProjectId(null);
                                  onOpenTestFlow(proj.name);
                                }}
                                className="px-3 py-1.5 rounded-lg hover:bg-surface-subtle text-text-primary flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                <span>View Test Flow</span>
                              </button>
                              <div className="h-px bg-border-subtle my-1"></div>
                              <button
                                type="button"
                                onClick={() => {
                                  setProjects((prev) => prev.filter((p) => p.id !== proj.id));
                                  setMenuOpenProjectId(null);
                                }}
                                className="px-3 py-1.5 rounded-lg hover:bg-status-failure-subtle text-status-failure flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                <span>Remove Project</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-1">
          <span>* Connected to GitHub via OAuth {githubUsername ? `(@${githubUsername})` : ''}</span>
          <button
            type="button"
            onClick={() => setProjectSearch('')}
            className="hover:text-text-primary underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      </div>
    </div>
  );
};
