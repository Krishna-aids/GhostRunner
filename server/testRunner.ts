/**
 * GhostRunner — Test Runner Engine
 *
 * Orchestrates the full E2E test execution pipeline:
 *   1. Generate GitHub App installation token
 *   2. Download the repo archive (ZIP) at a specific commit SHA
 *   3. Unzip to a temp directory
 *   4. npm install
 *   5. Detect & run the test framework (Playwright / Cypress / Jest / Vitest)
 *   6. Stream stdout/stderr via SSE to connected clients
 *   7. Write run results + log artifacts to Supabase
 *   8. (Optional) Post GitHub Check Run status back to the PR
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { getInstallationToken, isGitHubAppConfigured } from './githubAppAuth.js';
import { createCheckRun, completeCheckRun } from './checkRunService.js';
import { analyzeFailureAndHeal } from './healingAnalyzer.js';
import { Response as ExpressResponse } from 'express';

import dotenv from 'dotenv';
dotenv.config();

// ── Supabase (service role) ──────────────────────────────────────────────────
// The webhook server uses the SERVICE ROLE key so it can bypass RLS
// when writing run results on behalf of users.
function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !key) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)');
  }
  return createClient(url, key);
}

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://humans-hackwave3-0.vercel.app';
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || '4000', 10);
const WEBHOOK_PUBLIC_URL =
  process.env.WEBHOOK_PUBLIC_URL || process.env.VITE_WEBHOOK_URL || `http://localhost:${WEBHOOK_PORT}`;

// ── SSE client registry ──────────────────────────────────────────────────────
// Maps runId → array of active SSE response objects
const sseClients = new Map<string, ExpressResponse[]>();

export function registerSseClient(runId: string, res: ExpressResponse): void {
  if (!sseClients.has(runId)) sseClients.set(runId, []);
  sseClients.get(runId)!.push(res);
}

export function unregisterSseClient(runId: string, res: ExpressResponse): void {
  const clients = sseClients.get(runId) || [];
  sseClients.set(runId, clients.filter((c) => c !== res));
}

export function broadcastToRun(runId: string, data: object): void {
  const clients = sseClients.get(runId) || [];
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    try { res.write(payload); } catch { /* client disconnected */ }
  });
}

// ── Framework detection ──────────────────────────────────────────────────────

type TestFramework = 'playwright' | 'cypress' | 'jest' | 'vitest' | 'unknown';

function detectFrameworkFromDir(dir: string): TestFramework {
  const files = fs.readdirSync(dir);

  if (files.includes('playwright.config.ts') || files.includes('playwright.config.js'))
    return 'playwright';
  if (files.includes('cypress.config.ts') || files.includes('cypress.config.js') || files.includes('cypress.json'))
    return 'cypress';

  // Check package.json
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['@playwright/test'] || deps['playwright']) return 'playwright';
    if (deps['cypress']) return 'cypress';
    if (deps['vitest']) return 'vitest';
    if (deps['jest']) return 'jest';
  }

  return 'unknown';
}

function getRunCommand(framework: TestFramework): string[] {
  switch (framework) {
    case 'playwright':
      return ['npx', 'playwright', 'test', '--reporter=list'];
    case 'cypress':
      return ['npx', 'cypress', 'run', '--headless'];
    case 'vitest':
      return ['npx', 'vitest', 'run'];
    case 'jest':
      return ['npx', 'jest', '--forceExit', '--testTimeout=30000'];
    default:
      return ['npm', 'test', '--', '--reporter=verbose'];
  }
}

// ── Repo download ────────────────────────────────────────────────────────────

async function downloadAndExtractRepo(
  repoFullName: string,
  ref: string,
  installationToken: string,
  destDir: string
): Promise<void> {
  const archiveUrl = `https://api.github.com/repos/${repoFullName}/zipball/${ref}`;

  console.log(`   📥 Downloading repo archive: ${archiveUrl}`);

  const res = await fetch(archiveUrl, {
    headers: {
      Authorization: `token ${installationToken}`,
      Accept: 'application/vnd.github+json',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to download repo archive: ${res.status} ${res.statusText}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const zipPath = path.join(destDir, 'repo.zip');
  fs.writeFileSync(zipPath, Buffer.from(arrayBuf));

  // Extract using system unzip (cross-platform: node built-in)
  await extractZip(zipPath, destDir);

  // GitHub ZIP has a top-level dir like "owner-repo-sha7/"; find it
  const entries = fs.readdirSync(destDir).filter((e) => e !== 'repo.zip');
  if (entries.length === 1 && fs.statSync(path.join(destDir, entries[0])).isDirectory()) {
    // Flatten: move contents out of nested dir
    const nestedDir = path.join(destDir, entries[0]);
    const nestedEntries = fs.readdirSync(nestedDir);
    for (const entry of nestedEntries) {
      fs.renameSync(path.join(nestedDir, entry), path.join(destDir, entry));
    }
    fs.rmdirSync(nestedDir);
  }

  console.log(`   ✅ Repo extracted to ${destDir}`);
}

/** Native ZIP extraction using Node's built-in streams + fflate (no extra dep needed) */
async function extractZip(zipPath: string, destDir: string): Promise<void> {
  // Use child_process to call native unzip or PowerShell (cross-platform)
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const args = isWindows
      ? ['powershell', '-Command', `Expand-Archive -Path "${zipPath}" -DestinationPath "${destDir}" -Force`]
      : ['unzip', '-q', '-o', zipPath, '-d', destDir];

    const proc = spawn(args[0], args.slice(1), { stdio: 'pipe' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Zip extraction exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── Supabase helpers ─────────────────────────────────────────────────────────

async function updateRunStatus(
  runId: string,
  updates: {
    status: string;
    summary?: string;
    finished_at?: string;
    classification?: string;
    confidence?: number;
  }
): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('test_runs').update(updates).eq('id', runId);
  } catch (err) {
    console.error(`   ⚠️  Could not update run status in Supabase:`, err);
  }
}

async function appendLogArtifact(runId: string, content: string): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('evidence_artifacts').insert({
      test_run_id: runId,
      artifact_type: 'console_log',
      storage_path: `/logs/${runId}/runner.log`,
      metadata: { source: 'ghostrunner-runner' },
      content,
      url: null,
    });
  } catch (err) {
    console.error(`   ⚠️  Could not write log artifact to Supabase:`, err);
  }
}

// ── Main execution engine ────────────────────────────────────────────────────

export interface TriggerRunOptions {
  /** Supabase test_run row ID (already created as 'queued') */
  runId: string;
  /** Supabase project row ID */
  projectId: string;
  /** Full GitHub repo name: "owner/repo" */
  repoFullName: string;
  /** Branch name or commit SHA to test */
  ref: string;
  /** GitHub App installation ID (stored in project.repo_metadata.installation_id) */
  installationId: number;
  /** Optional: post check run back to this commit SHA (for PR triggers) */
  commitSha?: string;
  /** Optional: trigger label for logging */
  trigger?: 'manual' | 'push' | 'pull_request';
  /** Supabase test_definition ID — needed for healing analyzer */
  testDefinitionId?: string;
  /** Active test version ID — stored in repair_proposals.from_version_id */
  fromVersionId?: string;
}

export async function triggerTestRun(opts: TriggerRunOptions): Promise<void> {
  const {
    runId, repoFullName, ref, installationId,
    commitSha, trigger = 'manual',
    testDefinitionId, fromVersionId,
  } = opts;

  console.log(`\n🚀 triggerTestRun — ${repoFullName}@${ref} (run: ${runId}, trigger: ${trigger})`);

  let checkRunId: number | undefined;
  let installToken: string | undefined;
  const logLines: string[] = [];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `ghostrunner-${runId}-`));

  const log = (line: string) => {
    logLines.push(line);
    console.log(`   [runner] ${line}`);
    broadcastToRun(runId, { type: 'log', line: `[runner] ${line}` });
  };

  const setProgress = (pct: number) => {
    broadcastToRun(runId, { type: 'progress', pct });
  };

  try {
    // ── Step 1: Update status to 'preparing' ──────────────────────────────
    await updateRunStatus(runId, { status: 'preparing', summary: 'Fetching repository...' });
    broadcastToRun(runId, { type: 'status', status: 'preparing' });
    setProgress(5);

    // ── Step 1b: Real Playwright Engine Execution (Demo / Local) ──────────
    if (!isGitHubAppConfigured() || repoFullName.includes('acme-store')) {
      log('ℹ️  Executing via GhostRunner Real E2E Playwright Engine...');
      await executeRealPlaywrightRun(runId, testDefinitionId, commitSha, ref, log, setProgress);
      return;
    }

    // ── Step 1c: Python Execution Engine Delegation ───────────────────────
    if (testDefinitionId) {
      try {
        log(`⚡ Delegating execution to Python Engine (${PYTHON_BACKEND_URL})...`);
        const pyRes = await fetch(`${PYTHON_BACKEND_URL}/tests/${testDefinitionId}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': opts.projectId || 'system',
          },
          body: JSON.stringify({
            callback_url: WEBHOOK_PUBLIC_URL,
            environment_ref: ref,
          }),
        });

        if (pyRes.ok) {
          const pyData = await pyRes.json() as {
            id?: string;
            status: string;
            summary?: string;
            classification?: string;
            confidence?: number;
          };
          log(`✅ Python Engine execution finished: status=${pyData.status}`);
          await updateRunStatus(runId, {
            status: pyData.status,
            summary: pyData.summary,
            classification: pyData.classification,
            confidence: pyData.confidence,
            finished_at: new Date().toISOString(),
          });
          broadcastToRun(runId, {
            type: 'done',
            status: pyData.status,
            summary: pyData.summary,
          });
          setProgress(100);
          return;
        } else {
          log(`⚠️ Python engine returned status ${pyRes.status}. Continuing with standard runner...`);
        }
      } catch (pyErr) {
        log(`ℹ️ Python engine unavailable (${pyErr instanceof Error ? pyErr.message : String(pyErr)}). Continuing with standard runner...`);
      }
    }

    log('Obtaining installation access token...');
    const tokenData = await getInstallationToken(installationId);
    installToken = tokenData.token;
    log('Installation token obtained ✓');

    // ── Step 3: Post GitHub Check Run (queued) ────────────────────────────
    if (commitSha && installToken) {
      try {
        checkRunId = await createCheckRun({
          installationToken: installToken,
          repo: repoFullName,
          headSha: commitSha,
          status: 'in_progress',
          output: {
            title: 'GhostRunner E2E — running...',
            summary: `Running tests for \`${ref}\``,
          },
        });
        log(`GitHub Check Run created (id: ${checkRunId})`);
      } catch (checkErr) {
        log(`⚠️  Check run creation failed (non-fatal): ${checkErr}`);
      }
    }

    setProgress(15);

    // ── Step 4: Download + extract repo ──────────────────────────────────
    await updateRunStatus(runId, { status: 'running', summary: 'Downloading repository...' });
    broadcastToRun(runId, { type: 'status', status: 'running' });
    log(`Downloading repo archive for ${repoFullName}@${ref}...`);

    await downloadAndExtractRepo(repoFullName, ref, installToken, tmpDir);
    log('Repository extracted ✓');
    setProgress(30);

    // ── Step 5: Detect framework ──────────────────────────────────────────
    const framework = detectFrameworkFromDir(tmpDir);
    log(`Detected test framework: ${framework}`);
    setProgress(35);

    if (framework === 'unknown') {
      log('⚠️  No supported test framework detected (Playwright/Cypress/Jest/Vitest)');
      log('   Attempting to run `npm test` as fallback...');
    }

    // ── Step 6: npm install ───────────────────────────────────────────────
    log('Running npm install...');
    await runShellCommand('npm', ['install', '--prefer-offline', '--no-audit'], tmpDir, log);
    log('Dependencies installed ✓');
    setProgress(50);

    // ── Step 7: Install framework binary if needed ────────────────────────
    if (framework === 'playwright') {
      log('Installing Playwright browsers...');
      await runShellCommand('npx', ['playwright', 'install', '--with-deps', 'chromium'], tmpDir, log);
      setProgress(60);
    }

    // ── Step 8: Execute tests ─────────────────────────────────────────────
    const runCmd = getRunCommand(framework);
    log(`Executing: ${runCmd.join(' ')}`);
    await updateRunStatus(runId, { status: 'running', summary: `Running ${framework} test suite...` });
    broadcastToRun(runId, { type: 'framework', framework });

    const { exitCode } = await runShellCommand(runCmd[0], runCmd.slice(1), tmpDir, (line) => {
      log(line);
      setProgress(65); // keeps progress alive during test execution
    });

    // ── Step 9: Finalize ──────────────────────────────────────────────────
    const passed = exitCode === 0;
    const finalStatus = passed ? 'passed' : 'failed';
    const finalSummary = passed
      ? `All tests passed (${framework})`
      : `Some tests failed (${framework}, exit code: ${exitCode})`;

    log(`Test suite finished — ${finalStatus.toUpperCase()}`);
    setProgress(95);

    await updateRunStatus(runId, {
      status: finalStatus,
      summary: finalSummary,
      finished_at: new Date().toISOString(),
    });

    await appendLogArtifact(runId, logLines.join('\n'));

    broadcastToRun(runId, {
      type: 'done',
      status: finalStatus,
      summary: finalSummary,
      exitCode,
    });
    setProgress(100);

    // ── Step 9b: Trigger Groq self-healing analysis on failure ────────────
    if (!passed && testDefinitionId) {
      log('⚡ Triggering AI self-healing analysis (Groq)...');
      analyzeFailureAndHeal({
        runId,
        testDefinitionId,
        fromVersionId: fromVersionId || `ver-${Date.now()}`,
        logs: logLines.join('\n'),
        framework,
        repoFullName,
      }).catch((err) => console.error('   ❌ healingAnalyzer error:', err));
    }

    // ── Step 10: Update GitHub Check Run ──────────────────────────────────
    if (checkRunId && installToken) {
      try {
        await completeCheckRun(installToken, repoFullName, checkRunId, passed, finalSummary);
        log('GitHub Check Run updated ✓');
      } catch (checkErr) {
        log(`⚠️  Check run update failed (non-fatal): ${checkErr}`);
      }
    }

    log('✅ Run complete');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`   ❌ Run ${runId} failed with error:`, msg);
    log(`ERROR: ${msg}`);

    await updateRunStatus(runId, {
      status: 'environment_failed',
      summary: `Runner error: ${msg}`,
      finished_at: new Date().toISOString(),
    });

    await appendLogArtifact(runId, logLines.join('\n'));

    broadcastToRun(runId, { type: 'done', status: 'environment_failed', error: msg });

    if (checkRunId && installToken) {
      try {
        await completeCheckRun(installToken, repoFullName, checkRunId, false, `Runner error: ${msg}`);
      } catch { /* best effort */ }
    }
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch { /* ignore cleanup errors */ }
  }
}

// ── Shell command runner ─────────────────────────────────────────────────────

function runShellCommand(
  cmd: string,
  args: string[],
  cwd: string,
  onLine: (line: string) => void
): Promise<{ exitCode: number }> {
  return new Promise((resolve) => {
    const isExe = cmd.toLowerCase().endsWith('.exe');
    const proc: ChildProcess = spawn(cmd, args, {
      cwd,
      shell: isExe ? false : process.platform === 'win32',
      env: {
        ...process.env,
        CI: '1',               // tell frameworks to use non-interactive/CI mode
        FORCE_COLOR: '0',      // disable ANSI colors in output
      },
    });

    const lineBuffer = (data: Buffer, prefix: string) => {
      data.toString().split('\n').forEach((line) => {
        if (line.trim()) onLine(`${prefix}${line}`);
      });
    };

    proc.stdout?.on('data', (d) => lineBuffer(d, ''));
    proc.stderr?.on('data', (d) => lineBuffer(d, '[stderr] '));

    let resolved = false;
    const finish = (code: number | null) => {
      if (!resolved) {
        resolved = true;
        resolve({ exitCode: code ?? 0 });
      }
    };

    proc.on('exit', (code) => finish(code));
    proc.on('close', (code) => finish(code));
    proc.on('error', (err) => {
      onLine(`[spawn error] ${err.message}`);
      finish(1);
    });
  });
}

// ── Real Playwright Runner Execution ─────────────────────────────────────────

async function executeRealPlaywrightRun(
  runId: string,
  testDefinitionId: string | undefined,
  commitSha: string | undefined,
  ref: string | undefined,
  log: (line: string) => void,
  setProgress: (pct: number) => void
): Promise<void> {
  await updateRunStatus(runId, { status: 'running', summary: 'Starting Playwright engine...' });
  broadcastToRun(runId, { type: 'status', status: 'running' });
  setProgress(10);

  // Map testDefinitionId or fetch test name from Supabase
  let scenario = 'case_1';
  const supabase = getSupabase();
  if (testDefinitionId && supabase) {
    try {
      const { data: td } = await supabase
        .from('test_definitions')
        .select('name')
        .eq('id', testDefinitionId)
        .single();

      const name = td?.name || '';
      if (name.includes('TC-01') || name.toLowerCase().includes('baseline')) {
        scenario = 'case_1';
      } else if (name.includes('TC-02') || name.toLowerCase().includes('drift')) {
        scenario = 'case_2';
      } else if (name.includes('TC-03') || name.toLowerCase().includes('500') || name.toLowerCase().includes('outage')) {
        scenario = 'case_3';
      } else if (name.includes('TC-04') || name.toLowerCase().includes('regression')) {
        scenario = 'case_4';
      } else if (name.includes('TC-05') || name.toLowerCase().includes('auth') || name.toLowerCase().includes('rbac')) {
        scenario = 'case_5';
      }
    } catch {
      // fallback to case_1
    }
  }

  log(`[ghostrunner] Initiating Playwright headless Chromium for scenario: ${scenario}`);
  setProgress(20);

  let pythonBin = path.resolve(process.cwd(), '../backend/.venv/Scripts/python.exe');
  if (!fs.existsSync(pythonBin)) {
    pythonBin = path.resolve(process.cwd(), 'backend/.venv/Scripts/python.exe');
  }
  let scriptPath = path.resolve(process.cwd(), '../backend/scripts/run_real_scenario.py');
  if (!fs.existsSync(scriptPath)) {
    scriptPath = path.resolve(process.cwd(), 'backend/scripts/run_real_scenario.py');
  }

  const args = [
    '-u',
    scriptPath,
    '--run-id', runId,
    '--test-id', testDefinitionId || 'auto',
    '--scenario', scenario,
    '--base-url', 'http://127.0.0.1:3100',
    '--commit-sha', commitSha || 'HEAD',
  ];

  const logLines: string[] = [];
  const { exitCode } = await runShellCommand(pythonBin, args, path.resolve(process.cwd(), '..'), (line) => {
    log(line);
    logLines.push(line);
    setProgress(Math.min(95, 20 + Math.floor(logLines.length * 4)));
  });

  const passed = exitCode === 0;
  // Fetch updated status directly from Supabase to ensure consistency
  if (supabase) {
    try {
      const { data: updatedRun } = await supabase
        .from('test_runs')
        .select('status, summary, classification, confidence')
        .eq('id', runId)
        .single();

      if (updatedRun) {
        broadcastToRun(runId, {
          type: 'done',
          status: updatedRun.status,
          summary: updatedRun.summary,
          classification: updatedRun.classification,
          confidence: updatedRun.confidence,
          exitCode,
        });
        setProgress(100);
        return;
      }
    } catch {
      // ignore fetch errors
    }
  }

  broadcastToRun(runId, { type: 'done', status: passed ? 'passed' : 'failed', exitCode });
  setProgress(100);
}
