/**
 * GhostRunner — Local Webhook & ngrok Tunnel Launcher
 *
 * Starts the webhook Express server on port 4000 and connects or guides ngrok.
 */

import { spawn, execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_PORT = process.env.WEBHOOK_PORT || '4000';
const WEBHOOK_PUBLIC_URL = process.env.WEBHOOK_PUBLIC_URL || process.env.VITE_WEBHOOK_URL || '';
const GITHUB_APP_NAME = process.env.VITE_GITHUB_APP_NAME || 'humantohumanapp';

// Ensure port is not blocked by a stale process
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
    // Port is free or netstat found nothing
  }
}

freePortIfBusy(WEBHOOK_PORT);

console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
console.log(`║  🔮 GhostRunner Webhook & ngrok Tunnel Runner                  ║`);
console.log(`╠════════════════════════════════════════════════════════════════╣`);
console.log(`║  Local Webhook Port: ${WEBHOOK_PORT.padEnd(41)} ║`);
if (WEBHOOK_PUBLIC_URL && !WEBHOOK_PUBLIC_URL.includes('localhost')) {
  console.log(`║  Configured ngrok URL: ${WEBHOOK_PUBLIC_URL.padEnd(39)} ║`);
}
console.log(`╚════════════════════════════════════════════════════════════════╝\n`);

// Start webhook server
const webhook = spawn('npx', ['tsx', 'server/webhook.ts'], {
  stdio: 'inherit',
  shell: true,
});

let ngrokProcess: any = null;

// Try to spawn ngrok if available in PATH
try {
  const check = spawn('ngrok', ['--version'], { shell: true, stdio: 'ignore' });
  check.on('close', (code) => {
    if (code === 0) {
      console.log(`⚡ Detected ngrok in PATH — launching ngrok tunnel on port ${WEBHOOK_PORT}...\n`);
      ngrokProcess = spawn('ngrok', ['http', WEBHOOK_PORT], {
        stdio: 'inherit',
        shell: true,
      });
      ngrokProcess.on('exit', (c: number | null) => {
        console.log(`\n⚠️  ngrok tunnel exited (code ${c})`);
      });
    } else {
      showManualInstructions();
    }
  });
  check.on('error', () => {
    showManualInstructions();
  });
} catch {
  showManualInstructions();
}

function showManualInstructions() {
  console.log(`ℹ️  To expose this webhook server with ngrok:`);
  console.log(`   1. Open a new terminal and run:`);
  console.log(`      npx ngrok http ${WEBHOOK_PORT}   (or: winget install Ngrok.Ngrok)`);
  console.log(`   2. Copy the resulting HTTPS forwarding URL (e.g. https://xyz.ngrok-free.app)`);
  console.log(`   3. In your .env file, set:`);
  console.log(`      VITE_WEBHOOK_URL="https://xyz.ngrok-free.app"`);
  console.log(`      WEBHOOK_PUBLIC_URL="https://xyz.ngrok-free.app"`);
  console.log(`   4. In your GitHub App (https://github.com/settings/apps/${GITHUB_APP_NAME}):`);
  console.log(`      - Webhook URL:  https://xyz.ngrok-free.app/api/webhooks/github`);
  console.log(`      - Callback URL: https://xyz.ngrok-free.app/api/auth/github/callback\n`);
}

function cleanup() {
  if (webhook) webhook.kill();
  if (ngrokProcess) ngrokProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

webhook.on('exit', (code) => {
  console.log(`\n⚠️  Webhook server exited (code ${code})`);
  cleanup();
});
