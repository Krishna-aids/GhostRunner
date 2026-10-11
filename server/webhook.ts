/**
 * GhostRunner — GitHub App Webhook Server
 *
 * Receives webhook events from GitHub, verifies their HMAC signature,
 * and dispatches them to the appropriate handler for dynamic test
 * orchestration, self-healing, and repo analysis.
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.WEBHOOK_PORT || '4000', 10);
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

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

// ─── Event Handlers ────────────────────────────────────────────────────────

async function handleInstallation(event: WebhookEvent): Promise<void> {
  const action = event.action;
  const account = event.installation?.account?.login;
  const installationId = event.installation?.id;

  console.log(`\n🔧 Installation ${action} — account: ${account}, id: ${installationId}`);

  if (action === 'created') {
    // TODO: Store installation ID, begin repo discovery, analyze test frameworks
    console.log(`   → New installation! Ready to analyze repos for ${account}`);
  } else if (action === 'deleted') {
    // TODO: Clean up stored data for this installation
    console.log(`   → Installation removed for ${account}`);
  }
}

async function handlePush(event: WebhookEvent): Promise<void> {
  const repo = event.repository?.full_name;
  const branch = event.ref?.replace('refs/heads/', '');
  const sha = event.after?.substring(0, 7);
  const commitCount = event.commits?.length || 0;

  console.log(`\n📦 Push to ${repo}@${branch} (${sha}) — ${commitCount} commit(s)`);

  // Determine which test files were affected
  const modifiedFiles = event.commits?.flatMap(c => [...c.modified, ...c.added]) || [];
  const testFilePatterns = [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /\.e2e\.[jt]sx?$/, /__tests__\//];
  const affectedTestFiles = modifiedFiles.filter(f => testFilePatterns.some(p => p.test(f)));

  if (affectedTestFiles.length > 0) {
    console.log(`   → ${affectedTestFiles.length} test file(s) changed — triggering adaptive re-analysis`);
    // TODO: Queue dynamic test re-analysis for changed specs
  }

  // Check if source files changed (potential for test breakage / self-healing)
  const sourceFiles = modifiedFiles.filter(f => !testFilePatterns.some(p => p.test(f)));
  if (sourceFiles.length > 0) {
    console.log(`   → ${sourceFiles.length} source file(s) changed — queueing self-heal check`);
    // TODO: Run self-healing analysis against existing test suites
  }
}

async function handlePullRequest(event: WebhookEvent): Promise<void> {
  const action = event.action;
  const repo = event.repository?.full_name;
  const pr = event.pull_request;

  if (!pr) return;

  console.log(`\n🔀 PR #${pr.number} ${action} on ${repo}: "${pr.title}"`);
  console.log(`   → ${pr.head.ref} → ${pr.base.ref} (sha: ${pr.head.sha.substring(0, 7)})`);

  if (action === 'opened' || action === 'synchronize') {
    console.log(`   → Triggering full E2E test suite for PR #${pr.number}`);
    // TODO: Clone repo at PR head SHA, detect test framework, run adaptive test suite
    // TODO: Post check run / status back to GitHub
  }
}

async function handleCheckSuite(event: WebhookEvent): Promise<void> {
  console.log(`\n✅ Check suite ${event.action} for ${event.repository?.full_name}`);
  // TODO: Create/update check runs with GhostRunner test results
}

// ─── Express App ───────────────────────────────────────────────────────────
const app = express();

// CORS — allow frontend to call API
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
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
    res.status(400).json({ error: 'Missing code parameter' });
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

    // Redirect back to frontend with token
    let redirectUrl = `${FRONTEND_URL}/app?github_token=${tokenData.access_token}&github_user=${username}`;
    if (installation_id) {
      redirectUrl += `&installation_id=${installation_id}`;
    }
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('   ❌ OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/app?github_error=server_error`);
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ghostrunner-webhook',
    appId: GITHUB_APP_ID || 'not-configured',
    uptime: process.uptime(),
  });
});

// GitHub webhook endpoint
app.post('/api/webhooks/github', verifyGitHubSignature, async (req: Request, res: Response) => {
  const eventType = req.headers['x-github-event'] as string;
  const deliveryId = req.headers['x-github-delivery'] as string;
  const event: WebhookEvent = req.body;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📨 Webhook received: ${eventType} (delivery: ${deliveryId})`);
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
  console.log(`║  Endpoint: /api/webhooks/github                   ║`);
  console.log(`║  Health:   /health                                ║`);
  console.log(`║  Secret:   ${WEBHOOK_SECRET ? '✅ configured' : '⚠️  NOT SET (dev mode)'}                    ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
