import React, { useState, useEffect } from 'react';
import { Project } from '../../types/domain';
import { apiFetch } from '../../lib/api';
import { DEFAULT_OWNER_ID } from '../../lib/demoStore';
import { useAuth } from '../../context/AuthContext';

interface ProjectsPageProps {
  ownerId?: string;
  onOpenProject: (projectId: string) => void;
  onSwitchToImportView?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  ownerId: ownerIdProp,
  onOpenProject,
  onSwitchToImportView,
}) => {
  const { user } = useAuth();
  const ownerId = ownerIdProp || user?.id || DEFAULT_OWNER_ID;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Project modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Project[]>('/projects', ownerId);
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [ownerId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setCreateError('Project name is required');
      return;
    }
    if (trimmed.length > 255) {
      setCreateError('Project name cannot exceed 255 characters');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const newProj = await apiFetch<Project>('/projects', ownerId, {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      });
      setModalOpen(false);
      setProjectName('');
      setProjects((prev) => [newProj, ...prev]);
      setToastMessage(`Project "${newProj.name}" created successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-headline-lg text-2xl font-bold text-text-primary tracking-tight">
            Projects
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-text-secondary">
            Connected repositories, test suites, and automated healing pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onSwitchToImportView && (
            <button
              type="button"
              onClick={onSwitchToImportView}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-strong bg-surface-canvas text-xs font-semibold text-text-primary hover:bg-surface-subtle transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-text-secondary">
                account_tree
              </span>
              <span>Advanced Import</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchProjects}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-500 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-surface-canvas border border-border-subtle flex flex-col gap-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-surface-container rounded" />
                <div className="h-4 w-16 bg-surface-container rounded" />
              </div>
              <div className="h-3 w-32 bg-surface-container-low rounded" />
              <div className="h-9 w-full bg-surface-container-low rounded-xl mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="bg-surface-canvas rounded-2xl border-2 border-dashed border-border-strong p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-muted text-text-muted flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">folder_open</span>
          </div>
          <h3 className="text-base font-bold text-text-primary">No projects found</h3>
          <p className="text-xs text-text-secondary max-w-sm">
            Create a project to connect a repository and configure automated test pipelines.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
          >
            New Project
          </button>
        </div>
      )}

      {/* Projects Grid (2 Columns) */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const repoMeta = proj.repo_metadata as Record<string, unknown> | null;
            const githubUrl = repoMeta?.github_url as string | undefined;
            const stack = (repoMeta?.stack as string) || (repoMeta?.connected ? 'Next.js 14' : null);

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj.id)}
                className="group p-5 rounded-2xl bg-surface-canvas border border-border-subtle hover:border-primary/50 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {proj.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-text-primary group-hover:text-primary transition-colors truncate">
                          {proj.name}
                        </h3>
                        <span className="text-[11px] text-text-muted font-mono truncate">
                          Created {new Date(proj.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1 shrink-0">
                      Open <span className="font-mono">→</span>
                    </span>
                  </div>

                  {/* Connected Repository Pill */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    {githubUrl ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-text-secondary bg-surface-subtle px-2 py-0.5 rounded-md border border-border-subtle">
                        <span className="material-symbols-outlined text-[13px]">code</span>
                        <span className="truncate max-w-[200px]">{githubUrl}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-text-muted italic">
                        No repository connected
                      </span>
                    )}

                    {stack && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {stack}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                  <span>Self-Healing: Active</span>
                  <span className="text-text-primary font-medium group-hover:underline">
                    View Tests
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                </div>
                <h3 className="font-semibold text-base text-text-primary">Create New Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="new-project-name"
                  className="block text-xs font-semibold text-text-primary mb-1.5"
                >
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-project-name"
                  type="text"
                  autoFocus
                  disabled={isCreating}
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="e.g. E-Commerce Checkout"
                  maxLength={255}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary focus:bg-surface-canvas transition-all font-body-md"
                />
                {createError && (
                  <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{createError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
