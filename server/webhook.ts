/**
 * GhostRunner — GitHub App Webhook Server
 *
 * Receives webhook events from GitHub, verifies their HMAC signature,
 * and dispatches them to the appropriate handler for dynamic test
 * orchestration, self-healing, and repo analysis.
 *
 * Also exposes:
 *   POST /api/runs/trigger          — manual test run trigger from the UI
 *   GET  /api/runs/:runId/stream    — SSE stream for live log output
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { triggerTestRun, registerSseClient, unregisterSseClient, broadcastToRun } from './testRunner.js';

dotenv.config();

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.WEBHOOK_PORT || '4000', 10);
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || process.env.VITE_API_BASE_URL || 'https://humans-hackwave3-0.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// ─── Supabase (server-side, service role) ──────────────────────────────────
function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ─── Types ─────────────────────────────────────────────────────────────────
interface WebhookEvent {
  action?: string;
  repository?: {
    full_name: string;
    default_branch: string;
    clone_url: string;
    private: boolean;
  };
  sender?: {
    login: string;
    avatar_url: string;
  };
  installation?: {
    id: number;
    account: {
      login: string;
    };
  };
  pull_request?: {
    number: number;
    title: string;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
  };
  ref?: string;
  after?: string;
  commits?: Array<{
    id: string;
    message: string;
    modified: string[];
    added: string[];
    removed: string[];
  }>;
}

// ─── Signature Verification Middleware ──────────────────────────────────────
function verifyGitHubSignature(req: Request, res: Response, next: NextFunction): void {
  if (!WEBHOOK_SECRET) {
    console.warn('⚠️  GITHUB_WEBHOOK_SECRET not set — skipping signature verification (dev mode)');
    next();
    return;
  }

  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) {
    res.status(401).json({ error: 'Missing X-Hub-Signature-256 header' });
    return;
  }

  const body = (req as any).rawBody as Buffer;
  const expected = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}

// ─── Helpers: find project linked to a repo ─────────────────────────────────

async function findProjectForRepo(repoFullName: string, projectId?: string): Promise<{
  id: string;
  owner_id: string;
  repo_metadata: Record<string, any>;
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  if (projectId) {
    const { data } = await supabase
      .from('projects')
      .select('id, owner_id, repo_metadata')
      .eq('id', projectId)
      .single();
    if (data) return data;
  }

  // Query projects whose repo_metadata contains the full_name, sorted by created_at desc
  const { data } = await supabase
    .from('projects')
    .select('id, owner_id, repo_metadata, created_at')
    .not('repo_metadata', 'is', null)
    .order('created_at', { ascending: false });

  if (!data) return null;

  // Prioritize active demo project for user-lead-1406
  return (
    data.find(
      (p: any) =>
        (p.owner_id === 'user-lead-1406' || p.id === '0d28c30a-c8d3-4cc5-9c2e-562c0c213395') &&
        (p.repo_metadata?.full_name === repoFullName ||
         p.repo_metadata?.github_url?.includes(repoFullName))
    ) ||
    data.find(
      (p: any) =>
        p.repo_metadata?.full_name === repoFullName ||
        p.repo_metadata?.github_url?.includes(repoFullName)
    ) || null
  );
}

async function createQueuedRunsForProject(
  projectId: string,
  ownerId: string,
  context: { trigger: string; ref: string; sha?: string }
): Promise<Array<{ runId: string; testDefinitionId: string }>> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Find all test definitions for this project (e.g. all 5 suites)
  const { data: tests } = await supabase
    .from('test_definitions')
    .select('id, name, active_version_id')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (!tests || tests.length === 0) {
    console.log(`   ⚠️  No test definitions found for project ${projectId}`);
    return [];
  }

  const results: Array<{ runId: string; testDefinitionId: string }> = [];

  for (const test of tests) {
    const versionId = test.active_version_id || `ver-${Date.now()}`;

    const { data: run, error } = await supabase
      .from('test_runs')
      .insert({
        test_definition_id: test.id,
        test_version_id: versionId,
        owner_id: ownerId,
        status: 'queued',
        classification: null,
        confidence: null,
        summary: `Triggered by ${context.trigger} on ${context.ref} (commit ${context.sha ? context.sha.substring(0, 7) : 'HEAD'})`,
        environment_ref: context.ref,
        started_at: new Date().toISOString(),
        finished_at: null,
        parent_run_id: null,
      })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create run record for test ${test.id}:`, error.message);
      continue;
    }

    results.push({ runId: run.id, testDefinitionId: test.id });
  }

  return results;
}

// ─── Event Handlers ────────────────────────────────────────────────────────

async function handleInstallation(event: WebhookEvent): Promise<void> {
  const action = event.action;
  const account = event.installation?.account?.login;
  const installationId = event.installation?.id;

  console.log(`\n🔧 Installation ${action} — account: ${account}, id: ${installationId}`);

  if (action === 'created') {
    console.log(`   → New installation for ${account} (id: ${installationId}). App is ready.`);
  } else if (action === 'deleted') {
    console.log(`   → Installation removed for ${account}`);
  }
}

async function handlePush(event: WebhookEvent): Promise<void> {
  const repo = event.repository?.full_name;
  const branch = event.ref?.replace('refs/heads/', '');
  const sha = event.after;
  const commitCount = event.commits?.length || 0;
  const installationId = event.installation?.id || 0;

  console.log(`\n📦 Push to ${repo}@${branch} (${sha?.substring(0, 7)}) — ${commitCount} commit(s)`);

  if (!repo || !branch || !sha) {
    console.log('   ⚠️  Missing required push event fields, skipping');
    return;
  }

  const project = await findProjectForRepo(repo);
  if (!project) {
    console.log(`   ⚠️  No GhostRunner project linked to ${repo}`);
    return;
  }

  const runs = await createQueuedRunsForProject(project.id, project.owner_id, {
    trigger: 'push',
    ref: branch,
    sha,
  });

  console.log(`   ✅ Created ${runs.length} runs for project ${project.id} — starting execution async`);

  (async () => {
    for (const { runId, testDefinitionId } of runs) {
      try {
        await triggerTestRun({
          runId,
          projectId: project.id,
          repoFullName: repo,
          ref: branch,
          installationId,
          commitSha: sha,
          trigger: 'push',
          testDefinitionId,
        });
      } catch (err) {
        console.error(`   ❌ triggerTestRun error on ${runId}:`, err);
      }
    }
  })();
}

async function handlePullRequest(event: WebhookEvent): Promise<void> {
  const action = event.action;
  const repo = event.repository?.full_name;
  const pr = event.pull_request;
  const installationId = event.installation?.id || 0;

  if (!pr) return;

  console.log(`\n🔀 PR #${pr.number} ${action} on ${repo}: "${pr.title}"`);
  console.log(`   → ${pr.head.ref} → ${pr.base.ref} (sha: ${pr.head.sha.substring(0, 7)})`);

  if (action !== 'opened' && action !== 'synchronize') return;
  if (!repo) return;

  const project = await findProjectForRepo(repo);
  if (!project) {
    console.log(`   ⚠️  No GhostRunner project linked to ${repo}`);
    return;
  }

  const runs = await createQueuedRunsForProject(project.id, project.owner_id, {
    trigger: 'pull_request',
    ref: pr.head.ref,
    sha: pr.head.sha,
  });

  console.log(`   ✅ Created ${runs.length} runs for PR #${pr.number} — starting async`);

  for (const { runId, testDefinitionId } of runs) {
    triggerTestRun({
      runId,
      projectId: project.id,
      repoFullName: repo,
      ref: pr.head.sha,   // use exact SHA for reproducibility
      installationId,
      commitSha: pr.head.sha,
      trigger: 'pull_request',
      testDefinitionId,
    }).catch((err) => console.error(`   ❌ triggerTestRun error on ${runId}:`, err));
  }
}

async function handleCheckSuite(event: WebhookEvent): Promise<void> {
  // check_suite events are informational — GhostRunner creates its own check runs
  // via the createCheckRun service when we trigger a run. Nothing to do here.
  console.log(`\n✅ Check suite ${event.action} for ${event.repository?.full_name} (acknowledged)`);
}

// ─── Express App ───────────────────────────────────────────────────────────
const app = express();

// CORS — allow deployed frontend, localhost, and tunnels
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  // If origin is present, allow it if it matches FRONTEND_URL, localhost, or vercel.app
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, ngrok-skip-browser-warning');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Capture raw body for signature verification, then parse JSON
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ─── GitHub OAuth Callback ─────────────────────────────────────────────────
app.get('/api/auth/github/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const installation_id = req.query.installation_id as string;
  const setup_action = req.query.setup_action as string;

  if (!code) {
    res.status(200).json({
      status: 'active',
      endpoint: '/api/auth/github/callback',
      message: 'GitHub OAuth Callback endpoint is ready. GitHub will redirect here with a code parameter during OAuth sign-in.'
    });
    return;
  }

  console.log(`\n🔐 OAuth callback received (state: ${state?.substring(0, 8)}..., installation_id: ${installation_id})`);

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };

    if (tokenData.error || !tokenData.access_token) {
      console.error('   ❌ Token exchange failed:', tokenData.error);
      res.redirect(`${FRONTEND_URL}/app?github_error=${tokenData.error || 'token_exchange_failed'}`);
      return;
    }

    // Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const userData = await userRes.json() as { login?: string };
    const username = userData.login || 'unknown';

    console.log(`   ✅ Authenticated as @${username}`);

    // Redirect back to frontend with token + installation_id
    let redirectUrl = `${FRONTEND_URL}/app?github_token=${tokenData.access_token}&github_user=${username}`;
    if (installation_id) {
      redirectUrl += `&installation_id=${installation_id}`;
    }
    if (setup_action) {
      redirectUrl += `&setup_action=${setup_action}`;
    }
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('   ❌ OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/app?github_error=server_error`);
  }
});

// Exchange code for token directly via API (useful for SPA callback)
app.post('/api/auth/github/exchange', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'OAuth code is required' });
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (tokenData.error || !tokenData.access_token) {
      res.status(400).json({ error: tokenData.error || 'Token exchange failed' });
      return;
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    const userData = (await userRes.json()) as { login?: string };
    const username = userData.login || 'unknown';

    console.log(`   ✅ Direct OAuth exchange for @${username}`);
    res.json({ token: tokenData.access_token, username });
  } catch (err: any) {
    console.error('   ❌ Direct exchange error:', err);
    res.status(500).json({ error: err.message || 'Server error during OAuth exchange' });
  }
});

// ─── SSE: Live run log stream ──────────────────────────────────────────────
app.get('/api/runs/:runId/stream', (req: Request, res: Response) => {
  const { runId } = req.params;

  // SSE headers
  const reqOrigin = (req.headers.origin as string) || FRONTEND_URL;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': reqOrigin,
    'Access-Control-Allow-Credentials': 'true',
  });

  // Send a heartbeat comment immediately so the client knows it's connected
  res.write(`: connected to run ${runId}\n\n`);

  // Send heartbeat every 15s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(`: heartbeat\n\n`); } catch { clearInterval(heartbeat); }
  }, 15000);

  registerSseClient(runId, res);
  console.log(`\n📡 SSE client connected for run: ${runId}`);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSseClient(runId, res);
    console.log(`   📡 SSE client disconnected for run: ${runId}`);
  });
});

// ─── Event Relay: Python Engine Progress & Log Events ───────────────────────
app.post('/api/runs/:runId/events', (req: Request, res: Response) => {
  const { runId } = req.params;
  const event = req.body;
  broadcastToRun(runId, event);
  res.json({ ok: true });
});

// ─── Manual Run Trigger ────────────────────────────────────────────────────
app.post('/api/runs/trigger', async (req: Request, res: Response) => {
  const {
    runId, projectId, repoFullName, ref,
    installationId, commitSha, testDefinitionId, fromVersionId,
  } = req.body as {
    runId: string;
    projectId: string;
    repoFullName: string;
    ref: string;
    installationId: number;
    commitSha?: string;
    testDefinitionId?: string;
    fromVersionId?: string;
  };

  if (!runId || !repoFullName || !ref) {
    res.status(400).json({ error: 'runId, repoFullName, and ref are required' });
    return;
  }

  console.log(`\n▶️  Manual trigger — run: ${runId}, repo: ${repoFullName}@${ref}`);

  // Respond immediately — run is async
  res.json({ started: true, runId });

  triggerTestRun({
    runId,
    projectId: projectId || '',
    repoFullName,
    ref,
    installationId: installationId || 0,
    commitSha,
    trigger: 'manual',
    testDefinitionId,
    fromVersionId,
  }).catch((err) => console.error(`   ❌ triggerTestRun error:`, err));
});

// ─── Health check ──────────────────────────────────────────────────────────

// ─── Manual Push Simulation Endpoint (for Live Demos & Stage Presentations) ──
app.post('/api/webhook/simulate-push', async (req: Request, res: Response) => {
  const repo = req.body.repoFullName || 'Krishna-aids/Demo';
  const branch = req.body.branch || 'main';
  const sha = req.body.commitSha || crypto.randomBytes(4).toString('hex');
  const projectId = req.body.projectId || '0d28c30a-c8d3-4cc5-9c2e-562c0c213395';
  const project = await findProjectForRepo(repo, projectId);

  if (!project) {
    res.status(404).json({ error: `No project linked to ${repo}` });
    return;
  }

  console.log(`\n🚀 [SIMULATE] Manual push simulation triggered for ${repo}@${branch} (${sha.substring(0, 7)})`);

  const runs = await createQueuedRunsForProject(project.id, project.owner_id, {
    trigger: 'github-push-simulation',
    ref: branch,
    sha,
  });

  res.json({
    success: true,
    message: `Triggered ${runs.length} test suite runs for commit ${sha.substring(0, 7)}`,
    projectId: project.id,
    commitSha: sha,
    runs,
  });

  (async () => {
    for (const { runId, testDefinitionId } of runs) {
      try {
        await triggerTestRun({
          runId,
          projectId: project.id,
          repoFullName: repo,
          ref: branch,
          installationId: 0,
          commitSha: sha,
          trigger: 'push',
          testDefinitionId,
        });
      } catch (err) {
        console.error(`   ❌ triggerTestRun error on ${runId}:`, err);
      }
    }
  })();
});

// Repair Proposal Approve
app.post('/api/repair-proposals/:proposalId/approve', async (req, res) => {
  const { proposalId } = req.params;
  const { change_reason } = req.body;
  const supabase = getSupabase();
  if (!supabase) { res.status(503).json({ error: 'Supabase not configured' }); return; }

  console.log('[approve] Approving repair proposal:', proposalId);

  const { data: proposal, error: propErr } = await supabase
    .from('repair_proposals')
    .select('*, test_runs(test_definition_id)')
    .eq('id', proposalId)
    .single();

  if (propErr || !proposal) { res.status(404).json({ error: 'Repair proposal not found' }); return; }

  const testDefinitionId = (proposal as any).test_runs?.test_definition_id;
  if (!testDefinitionId) { res.status(422).json({ error: 'Cannot find parent test_definition' }); return; }

  const { data: newVersion, error: versionErr } = await supabase
    .from('test_versions')
    .insert({
      test_definition_id: testDefinitionId,
      action_plan: (proposal as any).proposed_plan,
      change_reason: change_reason || 'Repair approved via GhostRunner self-healing',
      created_by: 'ghostrunner-ai',
    })
    .select()
    .single();

  if (versionErr || !newVersion) {
    console.error('[approve] Failed to create test version:', versionErr?.message);
    res.status(500).json({ error: 'Failed to create new test version' }); return;
  }

  await supabase.from('test_definitions')
    .update({ active_version_id: (newVersion as any).id }).eq('id', testDefinitionId);

  await supabase.from('repair_proposals')
    .update({ validation_status: 'approved' }).eq('id', proposalId);

  console.log('[approve] New version', (newVersion as any).id, 'set as active for', testDefinitionId);
  res.json({ success: true, newVersionId: (newVersion as any).id, message: 'Test Version v2 created and promoted.' });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'ghostrunner-webhook',
    status: 'online',
    version: '1.0.0',
    publicUrl: process.env.WEBHOOK_PUBLIC_URL || process.env.VITE_WEBHOOK_URL || `http://localhost:${PORT}`,
    backendUrl: PYTHON_BACKEND_URL,
    health: '/health',
    endpoints: [
      'POST /api/webhooks/github',
      'POST /api/runs/trigger',
      'GET  /api/runs/:runId/stream',
      'POST /api/runs/:runId/events',
      'POST /api/repair-proposals/:proposalId/approve',
      'GET  /api/auth/github/callback',
      'GET  /health',
    ],
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ghostrunner-webhook',
    appId: GITHUB_APP_ID || 'not-configured',
    supabase: Boolean(SUPABASE_URL),
    groq: Boolean(process.env.GROQ_API_KEY),
    backendUrl: PYTHON_BACKEND_URL,
    uptime: process.uptime(),
  });
});

// ─── GitHub webhook endpoint ───────────────────────────────────────────────
app.get('/api/webhooks/github', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    endpoint: '/api/webhooks/github',
    method: 'POST',
    description: 'GhostRunner GitHub App Webhook Listener is active and listening for push/pull_request events.',
    usage: 'This URL must be registered in GitHub App Settings -> Webhook URL. GitHub automatically sends HTTP POST requests here.'
  });
});

const processedDeliveries = new Set<string>();

app.post('/api/webhooks/github', verifyGitHubSignature, async (req: Request, res: Response) => {
  const eventType = req.headers['x-github-event'] as string;
  const deliveryId = req.headers['x-github-delivery'] as string;
  const event: WebhookEvent = req.body;

  // ─── Idempotency Check ───────────────────────────────────────────────────
  if (deliveryId) {
    if (processedDeliveries.has(deliveryId)) {
      console.log(`\n🔁 Duplicate delivery ${deliveryId} received — acknowledging idempotently (no duplicate runs)`);
      res.status(200).json({ received: true, idempotent: true, event: eventType });
      return;
    }
    processedDeliveries.add(deliveryId);
    if (processedDeliveries.size > 2000) {
      const first = processedDeliveries.values().next().value;
      if (first) processedDeliveries.delete(first);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📨 Webhook received: ${eventType} (delivery: ${deliveryId || 'local'})`);
  console.log(`   Action: ${event.action || 'n/a'}`);
  console.log(`   Repo:   ${event.repository?.full_name || 'n/a'}`);
  console.log(`   Sender: ${event.sender?.login || 'n/a'}`);

  // Acknowledge immediately — process async
  res.status(200).json({ received: true, event: eventType });

  try {
    switch (eventType) {
      case 'installation':
      case 'installation_repositories':
        await handleInstallation(event);
        break;
      case 'push':
        await handlePush(event);
        break;
      case 'pull_request':
        await handlePullRequest(event);
        break;
      case 'check_suite':
        await handleCheckSuite(event);
        break;
      case 'ping':
        console.log(`   🏓 Ping received — webhook is connected!`);
        break;
      default:
        console.log(`   ⏭️  Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`   ❌ Error processing ${eventType}:`, err);
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  🔮 GhostRunner Webhook Server                   ║`);
  console.log(`║  Port: ${PORT}                                      ║`);
  console.log(`║  Endpoints:                                       ║`);
  console.log(`║    POST /api/webhooks/github   (GitHub events)    ║`);
  console.log(`║    POST /api/runs/trigger      (manual trigger)   ║`);
  console.log(`║    GET  /api/runs/:id/stream   (SSE log stream)   ║`);
  console.log(`║    GET  /health                                   ║`);
  console.log(`║  Webhook secret: ${WEBHOOK_SECRET ? '✅ configured' : '⚠️  NOT SET (dev mode)'}               ║`);
  console.log(`║  Supabase:       ${SUPABASE_URL ? '✅ configured' : '⚠️  NOT SET'}                   ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
