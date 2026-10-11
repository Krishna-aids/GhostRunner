/**
 * GhostRunner — GitHub Check Run Service
 *
 * Posts test run statuses back to GitHub PRs/commits as Check Runs.
 * This gives users native GitHub UI feedback (✅/❌) directly on their PRs.
 *
 * GitHub Checks API docs:
 *   https://docs.github.com/en/rest/checks/runs
 */

const GITHUB_API = 'https://api.github.com';

export type CheckRunStatus = 'queued' | 'in_progress' | 'completed';
export type CheckRunConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required';

export interface CheckRunOutput {
  title: string;
  summary: string;
  text?: string;
}

export interface CreateCheckRunParams {
  /** Installation access token (from getInstallationToken) */
  installationToken: string;
  /** Full repo name, e.g. "owner/repo" */
  repo: string;
  /** HEAD commit SHA for this check run */
  headSha: string;
  status: CheckRunStatus;
  conclusion?: CheckRunConclusion;
  output?: CheckRunOutput;
  detailsUrl?: string;
}

export interface UpdateCheckRunParams extends Omit<CreateCheckRunParams, 'headSha'> {
  checkRunId: number;
}

/**
 * Create a new Check Run on GitHub for the given commit SHA.
 * Returns the check run ID (needed for later updates).
 */
export async function createCheckRun(params: CreateCheckRunParams): Promise<number> {
  const { installationToken, repo, headSha, status, conclusion, output, detailsUrl } = params;

  const body: Record<string, unknown> = {
    name: 'GhostRunner E2E',
    head_sha: headSha,
    status,
    started_at: new Date().toISOString(),
    details_url: detailsUrl || 'https://ghostrunner.dev',
  };

  if (conclusion) {
    body.conclusion = conclusion;
    body.completed_at = new Date().toISOString();
  }

  if (output) {
    body.output = output;
  }

  const res = await fetch(`${GITHUB_API}/repos/${repo}/check-runs`, {
    method: 'POST',
    headers: {
      Authorization: `token ${installationToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`   ❌ Check run creation failed: ${res.status} ${errBody}`);
    throw new Error(`GitHub check run creation failed: ${res.status}`);
  }

  const data = await res.json() as { id: number; html_url: string };
  console.log(`   ✅ Check run created: ${data.html_url}`);
  return data.id;
}

/**
 * Update an existing Check Run (e.g. move from in_progress → completed).
 */
export async function updateCheckRun(params: UpdateCheckRunParams): Promise<void> {
  const { installationToken, repo, checkRunId, status, conclusion, output } = params;

  const body: Record<string, unknown> = { status };

  if (conclusion) {
    body.conclusion = conclusion;
    body.completed_at = new Date().toISOString();
  }

  if (output) {
    body.output = output;
  }

  const res = await fetch(`${GITHUB_API}/repos/${repo}/check-runs/${checkRunId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${installationToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`   ❌ Check run update failed: ${res.status} ${errBody}`);
    // Don't throw — don't let a check run failure break test result persistence
  }
}

/**
 * Convenience: mark a check run as completed with pass/fail summary.
 */
export async function completeCheckRun(
  installationToken: string,
  repo: string,
  checkRunId: number,
  passed: boolean,
  summary: string
): Promise<void> {
  await updateCheckRun({
    installationToken,
    repo,
    checkRunId,
    status: 'completed',
    conclusion: passed ? 'success' : 'failure',
    output: {
      title: passed ? '✅ GhostRunner: All tests passed' : '❌ GhostRunner: Tests failed',
      summary,
    },
  });
}
