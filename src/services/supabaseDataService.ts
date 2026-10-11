/**
 * GhostRunner Supabase Data Service
 *
 * All database interactions with Supabase for projects, tests, runs,
 * artifacts, and repair proposals. Authenticated via the current Supabase session.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import type {
  Project,
  TestDefinition,
  TestVersion,
  TestRun,
  EvidenceArtifact,
  RepairProposal,
} from '../types/domain';

// ── Projects ─────────────────────────────────────────────────────────────────

export async function fetchProjects(ownerId: string): Promise<Project[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function fetchProjectById(projectId: string): Promise<Project> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function createProject(
  ownerId: string,
  name: string
): Promise<Project> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('projects')
    .insert({ owner_id: ownerId, name, repo_metadata: null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

export async function updateProjectRepoMetadata(
  projectId: string,
  metadata: Record<string, unknown>
): Promise<Project> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('projects')
    .update({ repo_metadata: metadata })
    .eq('id', projectId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

// ── Test Definitions ──────────────────────────────────────────────────────────

export async function fetchTestsForProject(
  projectId: string
): Promise<TestDefinition[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  // Try with version join first
  const { data, error } = await supabase
    .from('test_definitions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TestDefinition[];
}

export async function fetchTestById(testId: string): Promise<TestDefinition> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('test_definitions')
    .select('*')
    .eq('id', testId)
    .single();
  if (error) throw new Error(error.message);

  // Fetch the active version separately if it exists
  const def = data as TestDefinition;
  if (def.active_version_id) {
    const { data: vData } = await supabase
      .from('test_versions')
      .select('*')
      .eq('id', def.active_version_id)
      .single();
    if (vData) def.current_version = vData as TestVersion;
  }

  return def;
}

export async function createTestDefinition(
  projectId: string,
  ownerId: string,
  payload: {
    name: string;
    original_intent: string;
    required_assertions?: unknown[];
  }
): Promise<TestDefinition> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('test_definitions')
    .insert({
      project_id: projectId,
      owner_id: ownerId,
      name: payload.name,
      original_intent: payload.original_intent,
      required_assertions: payload.required_assertions ?? [],
      preconditions: null,
      active_version_id: null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TestDefinition;
}

// ── Test Runs ─────────────────────────────────────────────────────────────────

export async function fetchRunsForTest(testId: string): Promise<TestRun[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('test_runs')
    .select('*')
    .eq('test_definition_id', testId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TestRun[];
}

export async function fetchRunById(runId: string): Promise<TestRun> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('test_runs')
    .select('*')
    .eq('id', runId)
    .single();
  if (error) throw new Error(error.message);
  return data as TestRun;
}

export async function createTestRun(
  testId: string,
  versionId: string,
  ownerId: string
): Promise<TestRun> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data: existing } = await supabase
    .from('test_runs')
    .select('id')
    .eq('test_definition_id', testId);
  const runNumber = ((existing ?? []).length) + 1;

  const { data, error } = await supabase
    .from('test_runs')
    .insert({
      test_definition_id: testId,
      test_version_id: versionId,
      owner_id: ownerId,
      status: 'queued',
      classification: null,
      confidence: null,
      summary: 'Test execution queued...',
      environment_ref: 'production',
      started_at: new Date().toISOString(),
      finished_at: null,
      parent_run_id: null,
      run_number: runNumber,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as TestRun;
}

/** Fetch all recent runs for a given owner (across all their projects/tests) */
export async function fetchAllRunsForOwner(
  ownerId: string,
  limit = 50
): Promise<TestRun[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('test_runs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as TestRun[];
}

// ── Evidence Artifacts ────────────────────────────────────────────────────────

export async function fetchArtifactsForRun(
  runId: string
): Promise<EvidenceArtifact[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('evidence_artifacts')
    .select('*')
    .eq('test_run_id', runId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as EvidenceArtifact[];
}

// ── Repair Proposals ──────────────────────────────────────────────────────────

export async function fetchRepairProposalsForRun(
  runId: string
): Promise<RepairProposal[]> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('repair_proposals')
    .select('*')
    .eq('test_run_id', runId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RepairProposal[];
}

export async function createRepairProposal(
  payload: Omit<RepairProposal, 'id' | 'created_at'>
): Promise<RepairProposal> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('repair_proposals')
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RepairProposal;
}

export async function approveRepairProposal(
  proposalId: string
): Promise<RepairProposal> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('repair_proposals')
    .update({ validation_status: 'approved' })
    .eq('id', proposalId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RepairProposal;
}

export async function rejectRepairProposal(
  proposalId: string
): Promise<RepairProposal> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('repair_proposals')
    .update({ validation_status: 'rejected' })
    .eq('id', proposalId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as RepairProposal;
}

// ── Metrics Helpers ───────────────────────────────────────────────────────────

export interface LiveMetrics {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  healedRuns: number;
  successRate: number;
  healsBoost: number;
  avgConfidence: number;
  pendingProposals: number;
}

export async function fetchLiveMetrics(ownerId: string): Promise<LiveMetrics> {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const { data: runs, error } = await supabase
    .from('test_runs')
    .select('status, confidence')
    .eq('owner_id', ownerId);

  if (error) throw new Error(error.message);

  const allRuns = runs ?? [];
  const total = allRuns.length;
  const passed = allRuns.filter((r) => r.status === 'passed').length;
  const failed = allRuns.filter((r) => r.status === 'failed').length;
  const healed = allRuns.filter(
    (r) => r.status === 'repair_proposed' || r.status === 'rerunning'
  ).length;
  const confidenceVals = allRuns
    .map((r) => r.confidence)
    .filter((c) => c != null) as number[];
  const avgConf = confidenceVals.length
    ? Math.round(confidenceVals.reduce((a, b) => a + b, 0) / confidenceVals.length)
    : 0;

  // Fetch pending proposals count
  const { count: pendingCount } = await supabase
    .from('repair_proposals')
    .select('id', { count: 'exact', head: true })
    .eq('validation_status', 'pending');

  const successRate =
    total > 0 ? Math.round(((passed + healed) / total) * 100 * 10) / 10 : 0;
  const rawRate =
    total > 0 ? Math.round((passed / total) * 100 * 10) / 10 : 0;
  const healsBoost = Math.max(0, successRate - rawRate);

  return {
    totalRuns: total,
    passedRuns: passed,
    failedRuns: failed,
    healedRuns: healed,
    successRate,
    healsBoost,
    avgConfidence: avgConf,
    pendingProposals: pendingCount ?? 0,
  };
}
