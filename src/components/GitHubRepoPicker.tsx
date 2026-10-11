/**
 * GitHubRepoPicker
 *
 * Reusable component that lets an authenticated user browse and select
 * a GitHub repository using the existing GitHub App OAuth integration.
 *
 * Security notes:
 * - Token is read from sessionStorage (existing pattern); never logged or displayed.
 * - Private repos are shown with a visibility warning.
 * - onSelect is called with only safe public fields (no token).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitHubRepo,
  getStoredGitHubAuth,
  initiateGitHubOAuth,
  handleOAuthCallback,
  fetchGitHubRepos,
  searchGitHubRepos,
  clearGitHubAuth,
  formatRelativeTime,
} from '../services/githubService';

export interface GitHubRepoSelection {
  repo: GitHubRepo;
  branch: string;
}

interface GitHubRepoPickerProps {
  /** Called when the user selects a repo + branch. */
  onSelect: (selection: GitHubRepoSelection) => void;
  /** full_name of currently selected repo, e.g. "owner/repo" */
  selectedRepoFullName?: string;
  /** Project ID to restore after OAuth redirect — saves context across the GitHub OAuth flow */
  returnProjectId?: string;
}

type PickerState =
  | 'not_connected'
  | 'loading_repos'
  | 'loaded'
  | 'error';

export const GitHubRepoPicker: React.FC<GitHubRepoPickerProps> = ({
  onSelect,
  selectedRepoFullName,
  returnProjectId,
}) => {
  const [pickerState, setPickerState] = useState<PickerState>('not_connected');
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Branch selection state — shown after a repo is picked
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [branchInput, setBranchInput] = useState('');

  const loadRepos = useCallback(async (token: string) => {
    setPickerState('loading_repos');
    setLoadError(null);
    try {
      const data = await fetchGitHubRepos(token, 1, 30);
      setRepos(data);
      setPickerState('loaded');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load repositories');
      setPickerState('error');
    }
  }, []);

  // On mount: check OAuth callback first, then stored auth
  useEffect(() => {
    const oauthResult = handleOAuthCallback();
    if (oauthResult) {
      setGithubUsername(oauthResult.username);
      loadRepos(oauthResult.token);
      return;
    }
    const stored = getStoredGitHubAuth();
    if (stored) {
      setGithubUsername(stored.username);
      loadRepos(stored.token);
    }
  }, [loadRepos]);

  // Debounced search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!query.trim()) return;

    const stored = getStoredGitHubAuth();
    if (!stored) return;

    const t = setTimeout(async () => {
      try {
        const results = await searchGitHubRepos(stored.token, query);
        setRepos(results);
      } catch {
        /* ignore search errors, keep existing list */
      }
    }, 400);
    setSearchTimeout(t);
  };

  const handleDisconnect = () => {
    clearGitHubAuth();
    setGithubUsername('');
    setRepos([]);
    setSelectedRepo(null);
    setBranchInput('');
    setPickerState('not_connected');
  };

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setBranchInput(repo.default_branch);
  };

  const handleConfirmSelection = () => {
    if (!selectedRepo) return;
    onSelect({ repo: selectedRepo, branch: branchInput || selectedRepo.default_branch });
  };

  const handleRetry = () => {
    const stored = getStoredGitHubAuth();
    if (stored) loadRepos(stored.token);
  };

  // ── NOT CONNECTED ──────────────────────────────────────────────────────────
  if (pickerState === 'not_connected') {
    return (
      <div className="p-5 rounded-2xl border-2 border-dashed border-border-strong bg-surface-subtle flex flex-col items-center gap-4 text-center">
        {/* GitHub icon */}
        <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-border-subtle flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-7 h-7 text-text-primary fill-current">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-text-primary mb-0.5">Connect GitHub</h3>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            Connect your GitHub account to browse and select repositories for testing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => initiateGitHubOAuth(returnProjectId)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#24292f] hover:bg-[#1c2128] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Continue with GitHub
        </button>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (pickerState === 'loading_repos') {
    return (
      <div className="p-5 rounded-2xl border border-border-subtle bg-surface-canvas flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span>Loading repositories for <strong>@{githubUsername}</strong>…</span>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-subtle border border-border-subtle animate-pulse" />
        ))}
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (pickerState === 'error') {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{loadError || 'Failed to load repositories.'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-500 cursor-pointer transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="px-3 py-1 rounded-lg border border-rose-400 text-rose-700 dark:text-rose-300 font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/30 cursor-pointer transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── LOADED ─────────────────────────────────────────────────────────────────

  // If a repo is selected, show the branch confirmation step
  if (selectedRepo) {
    const isCurrentlySelected = selectedRepo.full_name === selectedRepoFullName;
    return (
      <div className="flex flex-col gap-3">
        {/* Selected Repo Card */}
        <div className="p-4 rounded-xl border-2 border-primary/40 bg-primary/5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {selectedRepo.private ? 'lock' : 'public'}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-text-primary">{selectedRepo.full_name}</span>
                  {selectedRepo.private && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <span className="material-symbols-outlined text-[11px]">lock</span>
                      Private
                    </span>
                  )}
                  {selectedRepo.language && (
                    <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle">
                      {selectedRepo.language}
                    </span>
                  )}
                </div>
                {selectedRepo.description && (
                  <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{selectedRepo.description}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRepo(null)}
              className="text-text-muted hover:text-text-primary text-xs cursor-pointer shrink-0"
            >
              ✕ Change
            </button>
          </div>

          {/* Private repo warning */}
          {selectedRepo.private && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">warning</span>
              <span>
                This is a private repository. Backend inspection requires uploading a ZIP export.
                Repository identity will be stored as metadata.
              </span>
            </div>
          )}

          {/* Branch input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Branch / Ref
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-text-muted">
                  commit
                </span>
                <input
                  type="text"
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  placeholder={selectedRepo.default_branch}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-subtle border border-border-strong text-text-primary text-xs font-mono focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleConfirmSelection}
                disabled={!branchInput.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-95 transition-all shadow-xs cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                {isCurrentlySelected ? 'Update Branch' : 'Select This Repo'}
              </button>
            </div>
            <span className="text-[11px] text-text-muted font-mono">
              Default: {selectedRepo.default_branch} · Updated {formatRelativeTime(selectedRepo.updated_at)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Repo list view
  const filteredRepos = searchQuery
    ? repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : repos;

  return (
    <div className="flex flex-col gap-3">
      {/* Header row: connected as + disconnect */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-text-secondary">
            Connected as <strong className="text-text-primary">@{githubUsername}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-text-muted">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search repositories…"
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Currently selected indicator */}
      {selectedRepoFullName && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          <span>Currently connected: <strong>{selectedRepoFullName}</strong></span>
        </div>
      )}

      {/* Repo list */}
      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
        {filteredRepos.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            {searchQuery ? `No repositories matching "${searchQuery}"` : 'No repositories found.'}
          </div>
        ) : (
          filteredRepos.map((repo) => {
            const isSelected = repo.full_name === selectedRepoFullName;
            return (
              <button
                key={repo.id}
                type="button"
                onClick={() => handleSelectRepo(repo)}
                className={`group w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border-subtle bg-surface-canvas hover:border-primary/40 hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`}>
                    {repo.private ? 'lock' : 'folder_open'}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-semibold text-xs truncate ${isSelected ? 'text-primary' : 'text-text-primary group-hover:text-primary transition-colors'}`}>
                        {repo.full_name}
                      </span>
                      {repo.private && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                          Private
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {repo.language && (
                        <span className="text-[10px] font-mono text-text-muted">{repo.language}</span>
                      )}
                      <span className="text-[10px] text-text-muted">
                        {formatRelativeTime(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] font-mono shrink-0 ${isSelected ? 'text-primary font-semibold' : 'text-text-muted group-hover:text-primary'}`}>
                  {isSelected ? '✓ Selected' : 'Select →'}
                </span>
              </button>
            );
          })
        )}
      </div>

      <p className="text-[10px] text-text-muted text-center">
        {repos.length} repositories · Showing repos from your GitHub App installation
      </p>
    </div>
  );
};
