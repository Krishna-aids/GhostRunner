/**
 * GhostRunner — Local Dev Launcher
 *
 * Starts the webhook server AND the smee.io proxy together.
 * Reads SMEE_URL from .env automatically — no shell variable expansion needed.
 */

import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const SMEE_URL = process.env.SMEE_URL;
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || '4000';
const TARGET = `http://localhost:${WEBHOOK_PORT}/api/webhooks/github`;

function freePortIfBusy(port: string) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            console.log(`🧹 Port ${port} is currently in use by PID ${pid}. Automatically releasing...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`✅ Port ${port} released.`);
          }
        }
      }
    }
  } catch {
    // Port is free
  }
}

freePortIfBusy(WEBHOOK_PORT);

if (!SMEE_URL) {
  console.error('❌ SMEE_URL is not set in .env');
  console.error('   1. Go to https://smee.io and click "Start a new channel"');
  console.error('   2. Copy the URL and set SMEE_URL in your .env file');
  process.exit(1);
}

console.log(`\n🚀 Starting GhostRunner local dev environment...`);
console.log(`   Webhook server → localhost:${WEBHOOK_PORT}`);
console.log(`   Smee proxy     → ${SMEE_URL} → ${TARGET}\n`);

// Start webhook server
const webhook = spawn('npx', ['tsx', 'server/webhook.ts'], {
  stdio: 'inherit',
  shell: true,
});

// Start smee proxy
const smee = spawn('npx', ['smee', '-u', SMEE_URL, '-t', TARGET], {
  stdio: 'inherit',
  shell: true,
});

// Handle exits
function cleanup() {
  webhook.kill();
  smee.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

webhook.on('exit', (code) => {
  console.log(`\n⚠️  Webhook server exited (code ${code})`);
  cleanup();
});

smee.on('exit', (code) => {
  console.log(`\n⚠️  Smee proxy exited (code ${code})`);
  cleanup();
});
