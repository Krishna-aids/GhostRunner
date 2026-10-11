/**
 * GhostRunner — GitHub App Authentication
 *
 * Generates a signed JWT from the GitHub App private key, then exchanges it
 * for a short-lived installation access token. This token is used to:
 *   - Download repo archives (including private repos)
 *   - Post Check Runs back to GitHub PRs
 *
 * Requires:
 *   GITHUB_APP_ID          — numeric App ID from GitHub App settings
 *   GITHUB_PRIVATE_KEY_PATH — path to the .pem file downloaded from App settings
 *                             OR set GITHUB_PRIVATE_KEY as the raw PEM string
 */

import fs from 'fs';
import crypto from 'crypto';

const GITHUB_APP_ID = process.env.GITHUB_APP_ID || '';
const GITHUB_PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH || '';
const GITHUB_PRIVATE_KEY_RAW = process.env.GITHUB_PRIVATE_KEY || '';

// ── Minimal RS256 JWT signer (no external dep) ───────────────────────────────

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload: Record<string, unknown>, privateKey: string): string {
  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const body = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const sig = crypto.createSign('RSA-SHA256').update(data).sign(privateKey);
  return `${data}.${base64urlEncode(sig)}`;
}

// ── Private key loader ───────────────────────────────────────────────────────

function loadPrivateKey(): string {
  if (GITHUB_PRIVATE_KEY_RAW) {
    // Allow raw PEM passed as env var (newlines encoded as \n)
    return GITHUB_PRIVATE_KEY_RAW.replace(/\\n/g, '\n');
  }
  if (GITHUB_PRIVATE_KEY_PATH && fs.existsSync(GITHUB_PRIVATE_KEY_PATH)) {
    return fs.readFileSync(GITHUB_PRIVATE_KEY_PATH, 'utf-8');
  }
  throw new Error(
    'GitHub App private key not found. Set GITHUB_PRIVATE_KEY_PATH or GITHUB_PRIVATE_KEY in .env'
  );
}

// ── App JWT (valid for 10 minutes) ──────────────────────────────────────────

export function generateAppJwt(): string {
  if (!GITHUB_APP_ID) {
    throw new Error('GITHUB_APP_ID is not set in .env');
  }

  const privateKey = loadPrivateKey();
  const now = Math.floor(Date.now() / 1000);

  return signJwt(
    {
      iat: now - 60,       // issued 60s in the past (clock skew tolerance)
      exp: now + 9 * 60,   // expires in 9 minutes (max is 10)
      iss: GITHUB_APP_ID,
    },
    privateKey
  );
}

// ── Installation Access Token ────────────────────────────────────────────────

export interface InstallationToken {
  token: string;
  expires_at: string;
}

/**
 * Exchange a GitHub App JWT for a short-lived installation access token.
 * The token is scoped to the specific installation (user/org that installed the App).
 */
export async function getInstallationToken(installationId: number): Promise<InstallationToken> {
  const jwt = generateAppJwt();

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Failed to get installation token for id=${installationId}: ${res.status} ${body}`
    );
  }

  const data = await res.json() as InstallationToken;
  console.log(`   🔑 Installation token obtained (expires: ${data.expires_at})`);
  return data;
}

/**
 * Check whether GitHub App credentials are configured.
 */
export function isGitHubAppConfigured(): boolean {
  return Boolean(GITHUB_APP_ID && (GITHUB_PRIVATE_KEY_PATH || GITHUB_PRIVATE_KEY_RAW));
}
