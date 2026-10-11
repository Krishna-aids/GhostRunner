import React, { useState, useEffect, useRef } from 'react';
import { Project, TestDefinition, RequiredAssertion } from '../../types/domain';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface ProjectDetailPageProps {
  projectId: string;
  ownerId?: string;
  onBackToProjects: () => void;
  onOpenTest: (testId: string) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  projectId,
  ownerId: ownerIdProp,
  onBackToProjects,
  onOpenTest,
}) => {
  const { user } = useAuth();
  const ownerId = ownerIdProp || user?.id || 'user-demo-1406';
  const [project, setProject] = useState<Project | null>(null);
  const [tests, setTests] = useState<TestDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // GitHub connect state
  const [githubUrl, setGithubUrl] = useState('');
  const [isConnectingGit, setIsConnectingGit] = useState(false);

  // ZIP upload state
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Test modal state
  const [newTestModalOpen, setNewTestModalOpen] = useState(false);
  const [testName, setTestName] = useState('');
  const [testIntent, setTestIntent] = useState('');
  const [assertionsJson, setAssertionsJson] = useState(
    JSON.stringify(
      [
        {
          type: 'element_visible',
          target: { selector: '.order-success-banner' },
          expected_value: 'visible',
          description: 'Order confirmation banner is displayed',
        },
      ],
      null,
      2
    )
  );
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [testFormError, setTestFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, testsData] = await Promise.all([
        apiFetch<Project>(`/projects/${projectId}`, ownerId),
        apiFetch<TestDefinition[]>(`/projects/${projectId}/tests`, ownerId),
      ]);
      setProject(projData);
      setTests(testsData);

      const repoMeta = projData.repo_metadata as Record<string, unknown> | null;
      if (repoMeta?.github_url) {
        setGithubUrl(repoMeta.github_url as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, ownerId]);

  // Connect GitHub URL
  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) return;
    setIsConnectingGit(true);
    try {
      await apiFetch(`/projects/${projectId}/repository`, ownerId, {
        method: 'POST',
        body: JSON.stringify({ github_url: githubUrl.trim() }),
      });
      setToastMessage('GitHub connected ✅');
      setTimeout(() => setToastMessage(null), 3000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error connecting GitHub repository');
    } finally {
      setIsConnectingGit(false);
    }
  };

  // Upload ZIP
  const handleZipFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingZip(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call API
      await apiFetch(`/projects/${projectId}/repository`, ownerId, {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, size: file.size }),
      });

      setToastMessage(`Uploaded ${file.name} successfully ✅`);
      setTimeout(() => setToastMessage(null), 3000);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error uploading project archive');
    } finally {
      setIsUploadingZip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Create Test
  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      setTestFormError('Test name is required');
      return;
    }
    if (!testIntent.trim()) {
      setTestFormError('Original Intent description is required');
      return;
    }

    let parsedAssertions: RequiredAssertion[] = [];
    try {
      parsedAssertions = JSON.parse(assertionsJson);
    } catch {
      setTestFormError('Invalid JSON format in Required Assertions');
      return;
    }

    setIsCreatingTest(true);
    setTestFormError(null);
    try {
      const newTest = await apiFetch<TestDefinition>(`/projects/${projectId}/tests`, ownerId, {
        method: 'POST',
        body: JSON.stringify({
          name: testName.trim(),
          original_intent: testIntent.trim(),
          required_assertions: parsedAssertions,
        }),
      });

      setNewTestModalOpen(false);
      setTestName('');
      setTestIntent('');
      setTests((prev) => [newTest, ...prev]);
      setToastMessage(`Test "${newTest.name}" created!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setTestFormError(err instanceof Error ? err.message : 'Failed to create test definition');
    } finally {
      setIsCreatingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-pulse p-4">
        <div className="h-6 w-32 bg-surface-container rounded" />
        <div className="h-40 bg-surface-canvas rounded-2xl border border-border-subtle" />
        <div className="h-64 bg-surface-canvas rounded-2xl border border-border-subtle" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto my-12 text-center p-6 bg-surface-canvas rounded-2xl border border-border-subtle">
        <span className="material-symbols-outlined text-[36px] text-rose-500">error</span>
        <h2 className="text-base font-bold text-text-primary">Project Not Found</h2>
        <p className="text-xs text-text-secondary">{error || 'Unable to retrieve project.'}</p>
        <button
          type="button"
          onClick={onBackToProjects}
          className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold cursor-pointer"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const repoMeta = project.repo_metadata as Record<string, unknown> | null;
  const isConnectedOrUploaded = Boolean(repoMeta?.connected || repoMeta?.github_url || repoMeta?.stack);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs pb-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={onBackToProjects}
          className="text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>My Projects</span>
        </button>
        <span className="text-border-strong">/</span>
        <span className="font-semibold text-text-primary">{project.name}</span>
      </div>

      {/* SECTION A — Repository Connection */}
      <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">package_2</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-text-primary">
                Repository Connection
              </h2>
              <span className="text-[11px] text-text-muted">
                Connect your code to enable AST parsing and automated locator patch proposals
              </span>
            </div>
          </div>

          {isConnectedOrUploaded && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected ✅
            </span>
          )}
        </div>

        {/* Connect Action Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* GitHub input */}
          <form onSubmit={handleConnectGitHub} className="md:col-span-8 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-text-muted">
                link
              </span>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="github.com/owner/repo"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isConnectingGit || !githubUrl.trim()}
              className="px-4 py-2 rounded-xl bg-surface-canvas border border-border-strong text-text-primary text-xs font-semibold hover:bg-surface-subtle transition-all cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-40"
            >
              {isConnectingGit ? 'Connecting...' : 'Connect GitHub'}
            </button>
          </form>

          {/* Divider on mobile / or label */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs text-text-muted">or</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              onChange={handleZipFileSelected}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingZip}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs font-semibold hover:bg-surface-canvas transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-text-secondary">
                folder_zip
              </span>
              <span>{isUploadingZip ? 'Uploading...' : 'Upload ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Inspection Card if Connected / Uploaded */}
        {isConnectedOrUploaded && (
          <div className="mt-2 p-4 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-text-primary">
                  Stack: {String(repoMeta?.stack || 'Next.js 14')} ✅
                </span>
                <span className="text-text-muted font-mono text-[11px]">
                  Components: {String(repoMeta?.components || '23')} · Routes: {String(repoMeta?.routes || '12')} · Files: {String(repoMeta?.files || '45')}
                </span>
              </div>
            </div>

            <span className="text-text-secondary font-mono text-[11px] self-start sm:self-auto bg-surface-canvas px-2.5 py-1 rounded border border-border-subtle">
              AST Parser: Active
            </span>
          </div>
        )}
      </div>

      {/* SECTION B — Tests */}
      <div className="bg-surface-canvas rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm sm:text-base text-text-primary">
                Tests
              </h2>
              <span className="text-[11px] text-text-muted">
                {tests.length} intent-aware test suites configured for this project
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTestFormError(null);
              setNewTestModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Test</span>
          </button>
        </div>

        {/* Empty state */}
        {tests.length === 0 && (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-text-muted">
              playlist_add
            </span>
            <p className="text-xs text-text-secondary">No tests yet. Create your first test definition!</p>
          </div>
        )}

        {/* TestDefinitionCard list */}
        {tests.length > 0 && (
          <div className="flex flex-col gap-3">
            {tests.map((test) => {
              const versionNum = test.current_version?.version_number || 1;
              const isHealedV2 = versionNum >= 2;

              return (
                <div
                  key={test.id}
                  onClick={() => onOpenTest(test.id)}
                  className="group p-4 rounded-xl border border-border-subtle bg-surface-subtle hover:bg-surface-canvas hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors truncate">
                        {test.name}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                          isHealedV2
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : 'bg-surface-muted text-text-muted border-border-subtle'
                        }`}
                      >
                        v{versionNum} {isHealedV2 && '• Healed'}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {test.original_intent}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View &amp; Run <span className="font-mono">→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Test Modal */}
      {newTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add_task</span>
                </div>
                <h3 className="font-semibold text-base text-text-primary">Create New Test</h3>
              </div>
              <button
                type="button"
                onClick={() => setNewTestModalOpen(false)}
                className="text-text-muted hover:text-text-primary cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Test Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g. Checkout Flow"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary transition-all font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Original Intent (Natural Language) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={testIntent}
                  onChange={(e) => setTestIntent(e.target.value)}
                  placeholder="e.g. User adds item to cart, proceeds to checkout, completes payment, lands on order confirmation page"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-subtle border border-border-strong text-text-primary text-xs focus:outline-none focus:border-primary transition-all font-body-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Required Assertions (JSON Format)
                </label>
                <textarea
                  rows={5}
                  value={assertionsJson}
                  onChange={(e) => setAssertionsJson(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0a0a0a] text-slate-200 border border-border-strong text-xs font-mono focus:outline-none focus:border-primary transition-all"
                />
              </div>

              {testFormError && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{testFormError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setNewTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTest}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingTest ? 'Creating...' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
