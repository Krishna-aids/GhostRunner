/**
 * GhostRunner — GitHub OAuth & API Service
 *
 * Handles the GitHub App OAuth flow and provides API methods
 * for fetching the authenticated user's repositories.
 */

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const API_BASE = import.meta.env.VITE_WEBHOOK_URL || 'http://localhost:4000';

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url: string };
  private: boolean;
  default_branch: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  description: string | null;
  html_url: string;
}

const GITHUB_APP_NAME = import.meta.env.VITE_GITHUB_APP_NAME || 'humantohumanapp';

/**
 * Initiates GitHub App installation and OAuth by redirecting the user to the GitHub App installation page.
 * Because "Request user authorization (OAuth) during installation" is enabled in GitHub App settings,
 * this will both install the app AND authorize the user.
 * GitHub will redirect to our Setup URL (which should be set to /api/auth/github/callback)
 * containing `code`, `installation_id`, and `setup_action=install`.
 */
export function initiateGitHubOAuth(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem('github_oauth_state', state);

  const params = new URLSearchParams({
    state,
  });

  window.location.href = `https://github.com/apps/${GITHUB_APP_NAME}/installations/new?${params.toString()}`;
}

/**
 * Extract and store the GitHub access token from URL query params
 * (set by our callback endpoint after OAuth completes).
 */
export function handleOAuthCallback(): { token: string; username: string } | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('github_token');
  const username = params.get('github_user');

  if (token && username) {
    sessionStorage.setItem('github_access_token', token);
    sessionStorage.setItem('github_username', username);

    // Clean URL
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    return { token, username };
  }

  return null;
}

/**
 * Check if the user is already authenticated with GitHub.
 */
export function getStoredGitHubAuth(): { token: string; username: string } | null {
  const token = sessionStorage.getItem('github_access_token');
  const username = sessionStorage.getItem('github_username');

  if (token && username) {
    return { token, username };
  }
  return null;
}

/**
 * Clear stored GitHub auth.
 */
export function clearGitHubAuth(): void {
  sessionStorage.removeItem('github_access_token');
  sessionStorage.removeItem('github_username');
  sessionStorage.removeItem('github_oauth_state');
}

/**
 * Fetch the authenticated user's profile from the GitHub API.
 */
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Fetch repositories accessible to the authenticated user.
 * Returns repos sorted by most recently updated.
 */
export async function fetchGitHubRepos(
  token: string,
  page: number = 1,
  perPage: number = 30
): Promise<GitHubRepo[]> {
  const params = new URLSearchParams({
    sort: 'updated',
    direction: 'desc',
    per_page: perPage.toString(),
    page: page.toString(),
    type: 'all',
  });

  const res = await fetch(`https://api.github.com/user/repos?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Search repositories for the authenticated user.
 */
export async function searchGitHubRepos(
  token: string,
  query: string
): Promise<GitHubRepo[]> {
  const searchQuery = query ? `${query} in:name fork:true` : '';

  const res = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=updated&per_page=20`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Detect the testing framework used in a repository by checking common config files.
 */
export async function detectTestFramework(
  token: string,
  owner: string,
  repo: string
): Promise<string> {
  const filesToCheck = [
    { path: 'playwright.config.ts', framework: 'Playwright' },
    { path: 'playwright.config.js', framework: 'Playwright' },
    { path: 'cypress.config.ts', framework: 'Cypress' },
    { path: 'cypress.config.js', framework: 'Cypress' },
    { path: 'cypress.json', framework: 'Cypress' },
    { path: 'wdio.conf.ts', framework: 'WebdriverIO' },
    { path: 'wdio.conf.js', framework: 'WebdriverIO' },
  ];

  for (const { path, framework } of filesToCheck) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      if (res.ok) {
        return framework;
      }
    } catch {
      // File doesn't exist, continue checking
    }
  }

  // Check package.json for test dependencies
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const content = atob(data.content);
      if (content.includes('@playwright/test') || content.includes('playwright')) return 'Playwright';
      if (content.includes('cypress')) return 'Cypress';
      if (content.includes('selenium')) return 'Selenium';
      if (content.includes('puppeteer')) return 'Puppeteer';
      if (content.includes('jest')) return 'Jest';
      if (content.includes('vitest')) return 'Vitest';
    }
  } catch {
    // Couldn't read package.json
  }

  return 'Not detected';
}

/**
 * Helper to format relative time from an ISO date string.
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}
