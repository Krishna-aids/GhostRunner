/**
 * GhostRunner Domain Types
 * Matches the specification for Intent-Aware Self-Healing E2E Testing Platform.
 */

export type RunStatus =
  | 'queued'
  | 'preparing'
  | 'running'
  | 'collecting_evidence'
  | 'classifying'
  | 'repair_proposed'
  | 'rerunning'
  | 'passed'
  | 'failed'
  | 'needs_review'
  | 'environment_failed';

export type FailureCategory =
  | 'LOCATOR_DRIFT'
  | 'UI_FUNCTIONAL_REGRESSION'
  | 'API_FAILURE'
  | 'CONTRACT_MISMATCH'
  | 'ASSERTION_FAILURE'
  | 'ENVIRONMENT_FAILURE'
  | 'AMBIGUOUS_REQUIRES_REVIEW';

export type ArtifactType =
  | 'screenshot'
  | 'trace'
  | 'dom_snapshot'
  | 'console_log'
  | 'network_log'
  | 'report'
  | 'repair_candidate'
  | 'accessibility_snapshot';

export type RepairValidationStatus =
  | 'pending'
  | 'validating'
  | 'validated_pass'
  | 'validated_fail'
  | 'approved'
  | 'rejected';

export interface ActionTarget {
  role?: string | null;
  name?: string | null;
  text?: string | null;
  url?: string | null;
  selector?: string | null;
}

export interface RequiredAssertion {
  type: string;
  target: ActionTarget | string;
  expected_value: string | null;
  description: string | null;
}

export interface ActionStep {
  action: string;
  target: ActionTarget | string;
  value: string | null;
  timeout_ms: number;
}

export interface ActionPlan {
  steps: ActionStep[];
  required_assertions: RequiredAssertion[];
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  repo_metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface TestVersion {
  id: string;
  test_definition_id: string;
  version_number: number;
  action_plan: ActionPlan;
  assertions_snapshot: RequiredAssertion[];
  repository_revision: string | null;
  created_at: string;
  created_by: string;
  change_reason: string;
}

export interface TestDefinition {
  id: string;
  project_id: string;
  owner_id: string;
  name: string;
  original_intent: string;
  required_assertions: RequiredAssertion[];
  preconditions: Record<string, unknown> | null;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
  current_version: TestVersion | null;
}

export interface TestRun {
  id: string;
  test_definition_id: string;
  test_version_id: string;
  owner_id: string;
  status: RunStatus;
  classification: FailureCategory | null;
  confidence: number | null;
  summary: string | null;
  environment_ref: string | null;
  started_at: string | null;
  finished_at: string | null;
  parent_run_id: string | null;
  created_at: string;
  duration?: string;
  duration_ms?: number;
  run_number?: number;
}

export interface EvidenceArtifact {
  id: string;
  test_run_id: string;
  artifact_type: ArtifactType;
  storage_path: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  url: string | null;
  content?: string;
}

export interface RepairProposal {
  id: string;
  test_run_id: string;
  from_version_id: string;
  proposed_plan: ActionPlan;
  reason: string;
  evidence_refs: string[];
  confidence: number;
  validation_status: RepairValidationStatus;
  validation_run_id: string | null;
  created_at: string;
}
