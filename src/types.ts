export interface ExecutionStep {
  stepNumber: number;
  title: string;
  target?: string;
  status: 'passed' | 'healed' | 'failed';
  durationMs: number;
  brokenLocator?: string;
  errorMessage?: string;
  healedLocator?: string;
  matchScore?: number;
  matchReason?: string;
  interventionMs?: number;
}

export interface PlaywrightTraceInfo {
  browser: string;
  viewport: string;
  videoAvailable: boolean;
  harSize: string;
  networkRequests: number;
  consoleErrors: number;
  domSnapshots: number;
}

export interface TestRun {
  id: string;
  specFile: string;
  description: string;
  branch: string;
  timeAgo: string;
  duration: string;
  status: 'healed_passed' | 'passed' | 'failed' | 'running';
  statusSubtitle: string;
  healedCount?: number;
  steps: ExecutionStep[];
  consoleLogs?: string[];
  traceInfo?: PlaywrightTraceInfo;
}

export interface HealingQueueItem {
  id: string;
  specFile: string;
  line: number;
  testName: string;
  brokenSelector: string;
  proposedSelector: string;
  confidence: number;
  appliedRunsCount: number;
  branch: string;
  status: 'pending' | 'approved' | 'rejected';
  reasoning: string;
  dateDiscovered: string;
  suite: string;
}

export interface MetricSummary {
  successRate: number;
  healsBoost: number;
  selfHealedCount: number;
  avgConfidence: number;
  totalDuration: string;
  threads: number;
  failingCount: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  source: 'github' | 'gitlab' | 'bitbucket' | 'zip';
  repoFullName?: string;
  detectedFramework: string;
  language: string;
  lastAnalyzed: string;
  status: 'ready' | 'analyzing' | 'needs_setup' | 'failed';
  defaultBranch?: string;
  testCount?: number;
  filesCount?: number;
  description?: string;
  /** GitHub App metadata for triggering real test runs */
  repoMetadata?: {
    full_name: string;
    branch: string;
    installation_id: string;
    framework?: string;
    language?: string;
    connected?: boolean;
    last_synced?: string;
    [key: string]: unknown;
  };
}

export interface AnalysisStep {
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_attention';
  detail?: string;
  durationMs?: number;
}

export interface GitHubRepoItem {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  defaultBranch: string;
  updatedAt: string;
  language: string;
  stars: number;
  detectedFrameworkHint: string;
}

export interface GitHubProject {
  id: string;
  name: string;
  slug: string;
  domain: string;
  repo: string;
  branch: string;
  lastCommitMessage: string;
  lastCommitDate: string;
  iconType: string;
  iconLetter: string;
  selfHealingActive: boolean;
  healingRate: string;
  totalRuns: number;
  pendingHeals: number;
  lastRunStatus: 'healthy' | 'healing' | 'attention';
  framework: string;
  testRuns: TestRun[];
}

