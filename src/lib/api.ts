/**
 * GhostRunner API Client
 *
 * Primary: routes through Supabase when configured (RLS-secured, real data).
 * Fallback: local demo store for offline/demo scenarios.
 */

import {
  Project,
  TestDefinition,
  TestVersion,
  TestRun,
  EvidenceArtifact,
  RepairProposal,
  RunStatus,
} from '../types/domain';

import { isSupabaseConfigured } from '../services/supabaseClient';
import * as db from '../services/supabaseDataService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// ── In-Memory / Session Seeded Data for Resilient Demo Mode ──────────────────

const STORAGE_KEY = 'ghostrunner_demo_store_v1';

interface DemoStore {
  projects: Project[];
  tests: Record<string, TestDefinition[]>; // projectId -> TestDefinition[]
  runs: Record<string, TestRun[]>; // testId -> TestRun[]
  artifacts: Record<string, EvidenceArtifact[]>; // runId -> EvidenceArtifact[]
  proposals: Record<string, RepairProposal[]>; // runId -> RepairProposal[]
}

function getInitialStore(): DemoStore {
  const initialProjectId = 'proj-ecom-checkout';
  const initialTestId = 'test-checkout-flow';
  const initialVersionId = 'ver-v1';
  const initialRun1Id = 'run-demo-1';
  const initialRun2Id = 'run-demo-2';
  const initialProposalId = 'prop-drift-01';

  return {
    projects: [
      {
        id: initialProjectId,
        owner_id: 'user-demo-1406',
        name: 'E-Commerce Checkout',
        repo_metadata: {
          github_url: 'github.com/acme-corp/ecommerce-store',
          stack: 'Next.js 14',
          components: 23,
          routes: 12,
          files: 45,
          connected: true,
        },
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: 'proj-admin-portal',
        owner_id: 'user-demo-1406',
        name: 'Acme Admin Portal',
        repo_metadata: {
          github_url: 'github.com/acme-corp/admin-portal',
          stack: 'React + Vite',
          components: 42,
          routes: 18,
          files: 89,
          connected: true,
        },
        created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      },
    ],
    tests: {
      [initialProjectId]: [
        {
          id: initialTestId,
          project_id: initialProjectId,
          owner_id: 'user-demo-1406',
          name: 'Checkout Flow',
          original_intent:
            'User adds item to cart, proceeds to checkout, completes payment, and lands on order confirmation page.',
          required_assertions: [
            {
              type: 'element_visible',
              target: { role: 'button', name: 'Place Order' },
              expected_value: 'visible',
              description: 'Place Order CTA must be clickable on step 3',
            },
            {
              type: 'text_contains',
              target: { selector: '.order-success-banner' },
              expected_value: 'Order Confirmed',
              description: 'Confirmation banner displays order number',
            },
          ],
          preconditions: { user_logged_in: true, cart_items_count: 1 },
          active_version_id: initialVersionId,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          current_version: {
            id: initialVersionId,
            test_definition_id: initialTestId,
            version_number: 1,
            repository_revision: 'main@8f2c01d',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            created_by: 'QA Engineer',
            change_reason: 'Initial test definition generated from spec',
            action_plan: {
              steps: [
                { action: 'navigate', target: { url: '/cart' }, value: null, timeout_ms: 5000 },
                { action: 'click', target: { selector: 'button#btn-proceed-checkout' }, value: null, timeout_ms: 3000 },
                { action: 'fill', target: { selector: 'input[name="address"]' }, value: '742 Evergreen Terrace', timeout_ms: 2000 },
                { action: 'click', target: { selector: 'button.checkout-btn' }, value: null, timeout_ms: 3000 },
                { action: 'assert_visible', target: { selector: '.order-success-banner' }, value: null, timeout_ms: 5000 },
              ],
              required_assertions: [
                {
                  type: 'element_visible',
                  target: { selector: '.order-success-banner' },
                  expected_value: 'visible',
                  description: 'Confirmation banner appears',
                },
              ],
            },
            assertions_snapshot: [],
          },
        },
      ],
    },
    runs: {
      [initialTestId]: [
        {
          id: initialRun2Id,
          test_definition_id: initialTestId,
          test_version_id: initialVersionId,
          owner_id: 'user-demo-1406',
          status: 'failed',
          classification: 'LOCATOR_DRIFT',
          confidence: 87,
          summary: 'Button selector .checkout-btn not found. Element moved in DOM to semantic role.',
          environment_ref: 'demo-env',
          started_at: new Date(Date.now() - 120000).toISOString(),
          finished_at: new Date(Date.now() - 112000).toISOString(),
          parent_run_id: null,
          created_at: new Date(Date.now() - 120000).toISOString(),
          duration: '8s',
          run_number: 2,
        },
        {
          id: initialRun1Id,
          test_definition_id: initialTestId,
          test_version_id: initialVersionId,
          owner_id: 'user-demo-1406',
          status: 'passed',
          classification: null,
          confidence: null,
          summary: 'All 5 steps executed cleanly without DOM drift.',
          environment_ref: 'demo-env',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          finished_at: new Date(Date.now() - 3589000).toISOString(),
          parent_run_id: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          duration: '11s',
          run_number: 1,
        },
      ],
    },
    artifacts: {
      [initialRun2Id]: [
        {
          id: 'art-snap-1',
          test_run_id: initialRun2Id,
          artifact_type: 'screenshot',
          storage_path: '/screenshots/checkout_step4_failure.png',
          metadata: { step: 4, width: 1280, height: 720 },
          created_at: new Date(Date.now() - 114000).toISOString(),
          url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
        },
        {
          id: 'art-log-1',
          test_run_id: initialRun2Id,
          artifact_type: 'console_log',
          storage_path: '/logs/browser_console.log',
          metadata: { lines: 6 },
          created_at: new Date(Date.now() - 113000).toISOString(),
          url: null,
          content: `[09:28:01.10] [INFO]  Navigating to /cart
[09:28:01.32] [INFO]  Page loaded in 1.2s
[09:28:02.15] [INFO]  Clicked proceed-to-checkout button
[09:28:03.40] [INFO]  Address form submitted with test shipping details
[09:28:06.42] [ERROR] Cannot find element .checkout-btn: Timeout 3000ms exceeded waiting for selector
[09:28:06.45] [WARN]  DOM mutation detected: class .checkout-btn was removed during Tailwind CSS v4 migration
[09:28:06.50] [INFO]  GhostRunner self-healing analyzer initiated for test run ${initialRun2Id}`,
        },
        {
          id: 'art-trace-1',
          test_run_id: initialRun2Id,
          artifact_type: 'trace',
          storage_path: '/traces/playwright_trace.zip',
          metadata: { size: '3.4 MB' },
          created_at: new Date(Date.now() - 112000).toISOString(),
          url: '#download-trace',
        },
        {
          id: 'art-dom-1',
          test_run_id: initialRun2Id,
          artifact_type: 'dom_snapshot',
          storage_path: '/snapshots/checkout_dom.html',
          metadata: { elementsCount: 842 },
          created_at: new Date(Date.now() - 112000).toISOString(),
          url: '#download-dom',
        },
      ],
    },
    proposals: {
      [initialRun2Id]: [
        {
          id: initialProposalId,
          test_run_id: initialRun2Id,
          from_version_id: initialVersionId,
          reason: 'Button selector .checkout-btn has changed in DOM. Replacement element found with matching role and text.',
          confidence: 91,
          validation_status: 'pending',
          validation_run_id: null,
          evidence_refs: ['art-snap-1', 'art-log-1'],
          created_at: new Date(Date.now() - 110000).toISOString(),
          proposed_plan: {
            steps: [
              { action: 'navigate', target: { url: '/cart' }, value: null, timeout_ms: 5000 },
              { action: 'click', target: { selector: 'button#btn-proceed-checkout' }, value: null, timeout_ms: 3000 },
              { action: 'fill', target: { selector: 'input[name="address"]' }, value: '742 Evergreen Terrace', timeout_ms: 2000 },
              {
                action: 'click',
                target: { role: 'button', name: 'Place Order', selector: 'button[data-testid="place-order-cta"]' },
                value: null,
                timeout_ms: 3000,
              },
              { action: 'assert_visible', target: { selector: '.order-success-banner' }, value: null, timeout_ms: 5000 },
            ],
            required_assertions: [
              {
                type: 'element_visible',
                target: { selector: '.order-success-banner' },
                expected_value: 'visible',
                description: 'Confirmation banner appears with order confirmation',
              },
            ],
          },
        },
      ],
    },
  };
}

function loadStore(): DemoStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const initial = getInitialStore();
  saveStore(initial);
  return initial;
}

function saveStore(store: DemoStore): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}


// ── API Fetch Client ─────────────────────────────────────────────────────────

/**
 * Supabase-backed implementation of apiFetch routes.
 * Called when Supabase credentials are configured.
 */
async function supabaseFetch<T>(
  endpoint: string,
  ownerId: string,
  options: RequestInit
): Promise<T> {
  const method = options.method?.toUpperCase() || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // GET /projects
  if (endpoint === '/projects' && method === 'GET') {
    return db.fetchProjects(ownerId) as unknown as T;
  }

  // POST /projects
  if (endpoint === '/projects' && method === 'POST') {
    return db.createProject(ownerId, body.name || 'Untitled Project') as unknown as T;
  }

  // GET /projects/:id
  const projectMatch = endpoint.match(/^\/projects\/([^/]+)$/);
  if (projectMatch && method === 'GET') {
    return db.fetchProjectById(projectMatch[1]) as unknown as T;
  }

  // POST /projects/:id/repository
  const repoMatch = endpoint.match(/^\/projects\/([^/]+)\/repository$/);
  if (repoMatch && method === 'POST') {
    const meta = {
      ...(body || {}),
      stack: body.stack || 'Next.js 14',
      connected: true,
      last_synced: new Date().toISOString(),
    };
    const updated = await db.updateProjectRepoMetadata(repoMatch[1], meta);
    return { success: true, repo_metadata: updated.repo_metadata } as unknown as T;
  }

  // GET /projects/:id/tests
  const testsMatch = endpoint.match(/^\/projects\/([^/]+)\/tests$/);
  if (testsMatch && method === 'GET') {
    return db.fetchTestsForProject(testsMatch[1]) as unknown as T;
  }

  // POST /projects/:id/tests
  if (testsMatch && method === 'POST') {
    return db.createTestDefinition(testsMatch[1], ownerId, {
      name: body.name || 'New Test Spec',
      original_intent: body.original_intent || 'Verifies core user workflow.',
      required_assertions: body.required_assertions,
    }) as unknown as T;
  }

  // GET /tests/:id
  const testDetailMatch = endpoint.match(/^\/tests\/([^/]+)$/);
  if (testDetailMatch && method === 'GET') {
    return db.fetchTestById(testDetailMatch[1]) as unknown as T;
  }

  // GET /tests/:id/runs
  const testRunsMatch = endpoint.match(/^\/tests\/([^/]+)\/runs$/);
  if (testRunsMatch && method === 'GET') {
    return db.fetchRunsForTest(testRunsMatch[1]) as unknown as T;
  }

  // POST /tests/:id/runs
  if (testRunsMatch && method === 'POST') {
    const testDef = await db.fetchTestById(testRunsMatch[1]).catch(() => null);
    const versionId = testDef?.active_version_id || `ver-${Date.now()}`;
    return db.createTestRun(testRunsMatch[1], versionId, ownerId) as unknown as T;
  }

  // GET /runs/:id
  const runMatch = endpoint.match(/^\/runs\/([^/]+)$/);
  if (runMatch && method === 'GET') {
    return db.fetchRunById(runMatch[1]) as unknown as T;
  }

  // GET /runs/:id/artifacts
  const artMatch = endpoint.match(/^\/runs\/([^/]+)\/artifacts$/);
  if (artMatch && method === 'GET') {
    return db.fetchArtifactsForRun(artMatch[1]) as unknown as T;
  }

  // GET /runs/:id/repair-proposals
  const propMatch = endpoint.match(/^\/runs\/([^/]+)\/repair-proposals$/);
  if (propMatch && method === 'GET') {
    return db.fetchRepairProposalsForRun(propMatch[1]) as unknown as T;
  }

  // POST /runs/:id/repair-proposals
  if (propMatch && method === 'POST') {
    return db.createRepairProposal({
      test_run_id: propMatch[1],
      from_version_id: body.from_version_id || 'ver-1',
      reason: body.reason || 'Manually proposed locator update',
      confidence: body.confidence || 85,
      validation_status: 'pending',
      validation_run_id: null,
      evidence_refs: [],
      proposed_plan: body.proposed_plan || { steps: [], required_assertions: [] },
    }) as unknown as T;
  }

  // POST /repair-proposals/:pid/approve
  const approveMatch = endpoint.match(/^\/repair-proposals\/([^/]+)\/approve$/);
  if (approveMatch && method === 'POST') {
    await db.approveRepairProposal(approveMatch[1]);
    return { success: true, message: 'Repair proposal approved.' } as unknown as T;
  }

  // POST /runs/:id/repair-proposals/:pid/validate
  const validateMatch = endpoint.match(/^\/runs\/([^/]+)\/repair-proposals\/([^/]+)\/validate$/);
  if (validateMatch && method === 'POST') {
    await db.approveRepairProposal(validateMatch[2]);
    return { success: true } as unknown as T;
  }

  throw new Error(`[Supabase] Unhandled endpoint: ${endpoint}`);
}

export async function apiFetch<T>(
  endpoint: string,
  ownerId: string = 'user-demo-1406',
  options: RequestInit = {}
): Promise<T> {
  // ── Supabase Routing (primary when configured) ────────────────────────────
  if (isSupabaseConfigured()) {
    try {
      return await supabaseFetch<T>(endpoint, ownerId, options);
    } catch (err) {
      console.warn(`[GhostRunner] Supabase request for ${endpoint} failed, falling back to demo store.`, err);
    }
  }

  // ── Local Simulation Handler for Demo Resilience ─────────────────────────
  await new Promise((r) => setTimeout(r, 120)); // realistic latency
  const store = loadStore();

  // Route 1: GET /projects
  if (endpoint === '/projects' && (!options.method || options.method === 'GET')) {
    return store.projects as unknown as T;
  }

  // Route 2: POST /projects
  if (endpoint === '/projects' && options.method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      owner_id: ownerId,
      name: body.name || 'Untitled Project',
      repo_metadata: null,
      created_at: new Date().toISOString(),
    };
    store.projects.unshift(newProject);
    store.tests[newProject.id] = [];
    saveStore(store);
    return newProject as unknown as T;
  }

  // Route 3: GET /projects/:id
  const projectMatch = endpoint.match(/^\/projects\/([^/]+)$/);
  if (projectMatch && (!options.method || options.method === 'GET')) {
    const pId = projectMatch[1];
    const found = store.projects.find((p) => p.id === pId);
    if (!found) throw new Error('Project not found');
    return found as unknown as T;
  }

  // Route 4: POST /projects/:id/repository (connect or upload)
  const repoMatch = endpoint.match(/^\/projects\/([^/]+)\/repository$/);
  if (repoMatch && options.method === 'POST') {
    const pId = repoMatch[1];
    const proj = store.projects.find((p) => p.id === pId);
    if (!proj) throw new Error('Project not found');

    const meta = {
      stack: 'Next.js 14 ✅',
      components: 23,
      routes: 12,
      files: 45,
      connected: true,
      last_synced: new Date().toISOString(),
    };
    proj.repo_metadata = { ...(proj.repo_metadata || {}), ...meta };
    saveStore(store);
    return { success: true, repo_metadata: proj.repo_metadata } as unknown as T;
  }

  // Route 5: GET /projects/:id/tests
  const testsMatch = endpoint.match(/^\/projects\/([^/]+)\/tests$/);
  if (testsMatch && (!options.method || options.method === 'GET')) {
    const pId = testsMatch[1];
    const list = store.tests[pId] || [];
    return list as unknown as T;
  }

  // Route 6: POST /projects/:id/tests (create test)
  if (testsMatch && options.method === 'POST') {
    const pId = testsMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const testId = `test-${Date.now()}`;
    const versionId = `ver-${Date.now()}`;

    const newTest: TestDefinition = {
      id: testId,
      project_id: pId,
      owner_id: ownerId,
      name: body.name || 'New Test Spec',
      original_intent: body.original_intent || 'Verifies core user workflow and UI state transitions.',
      required_assertions: body.required_assertions || [],
      preconditions: null,
      active_version_id: versionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_version: {
        id: versionId,
        test_definition_id: testId,
        version_number: 1,
        repository_revision: 'main@latest',
        created_at: new Date().toISOString(),
        created_by: 'QA Engineer',
        change_reason: 'Initial creation',
        action_plan: {
          steps: [
            { action: 'navigate', target: { url: '/' }, value: null, timeout_ms: 5000 },
            { action: 'click', target: { selector: 'button.primary' }, value: null, timeout_ms: 3000 },
          ],
          required_assertions: body.required_assertions || [],
        },
        assertions_snapshot: [],
      },
    };

    if (!store.tests[pId]) store.tests[pId] = [];
    store.tests[pId].unshift(newTest);
    store.runs[testId] = [];
    saveStore(store);
    return newTest as unknown as T;
  }

  // Route 7: GET /tests/:id
  const testDetailMatch = endpoint.match(/^\/tests\/([^/]+)$/);
  if (testDetailMatch && (!options.method || options.method === 'GET')) {
    const tId = testDetailMatch[1];
    for (const pId in store.tests) {
      const found = store.tests[pId].find((t) => t.id === tId);
      if (found) return found as unknown as T;
    }
    throw new Error('Test definition not found');
  }

  // Route 8: GET /tests/:id/runs
  const testRunsMatch = endpoint.match(/^\/tests\/([^/]+)\/runs$/);
  if (testRunsMatch && (!options.method || options.method === 'GET')) {
    const tId = testRunsMatch[1];
    return (store.runs[tId] || []) as unknown as T;
  }

  // Route 9: POST /tests/:id/runs (trigger test run)
  if (testRunsMatch && options.method === 'POST') {
    const tId = testRunsMatch[1];
    let testDef: TestDefinition | null = null;
    for (const pId in store.tests) {
      const match = store.tests[pId].find((t) => t.id === tId);
      if (match) {
        testDef = match;
        break;
      }
    }

    const runId = `run-${Date.now()}`;
    const currentVer = testDef?.current_version?.version_number || 1;
    const isV2 = currentVer >= 2;

    const newRun: TestRun = {
      id: runId,
      test_definition_id: tId,
      test_version_id: testDef?.active_version_id || 'ver-1',
      owner_id: ownerId,
      status: 'queued',
      classification: null,
      confidence: null,
      summary: 'Test execution initiated in demo container...',
      environment_ref: 'demo-env',
      started_at: new Date().toISOString(),
      finished_at: null,
      parent_run_id: null,
      created_at: new Date().toISOString(),
      duration: isV2 ? '12s' : '8s',
      run_number: (store.runs[tId]?.length || 0) + 1,
    };

    if (!store.runs[tId]) store.runs[tId] = [];
    store.runs[tId].unshift(newRun);

    // Seed artifacts & proposal for this run
    if (!isV2) {
      // Simulate Failure on v1 to trigger self-healing loop
      store.artifacts[runId] = [
        {
          id: `art-snap-${Date.now()}`,
          test_run_id: runId,
          artifact_type: 'screenshot',
          storage_path: '/screenshots/failure_drift.png',
          metadata: { step: 4 },
          created_at: new Date().toISOString(),
          url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
        },
        {
          id: `art-log-${Date.now()}`,
          test_run_id: runId,
          artifact_type: 'console_log',
          storage_path: '/logs/console.log',
          metadata: {},
          created_at: new Date().toISOString(),
          url: null,
          content: `[ERROR] Cannot find element .checkout-btn
[INFO]  Page loaded in 1.2s
[WARN]  Button selector .checkout-btn not found. Element moved in DOM to semantic role.`,
        },
        {
          id: `art-trace-${Date.now()}`,
          test_run_id: runId,
          artifact_type: 'trace',
          storage_path: '/traces/trace.zip',
          metadata: {},
          created_at: new Date().toISOString(),
          url: '#download',
        },
      ];

      store.proposals[runId] = [
        {
          id: `prop-${Date.now()}`,
          test_run_id: runId,
          from_version_id: testDef?.active_version_id || 'ver-1',
          reason: 'Button selector has changed to semantic role button with name "Place Order"',
          confidence: 91,
          validation_status: 'pending',
          validation_run_id: null,
          evidence_refs: [],
          created_at: new Date().toISOString(),
          proposed_plan: {
            steps: [
              { action: 'navigate', target: { url: '/cart' }, value: null, timeout_ms: 5000 },
              { action: 'click', target: { role: 'button', name: 'Place Order' }, value: null, timeout_ms: 3000 },
            ],
            required_assertions: testDef?.required_assertions || [],
          },
        },
      ];
    }

    saveStore(store);
    return newRun as unknown as T;
  }

  // Route 10: GET /runs/:id
  const runMatch = endpoint.match(/^\/runs\/([^/]+)$/);
  if (runMatch && (!options.method || options.method === 'GET')) {
    const rId = runMatch[1];
    for (const tId in store.runs) {
      const match = store.runs[tId].find((r) => r.id === rId);
      if (match) return match as unknown as T;
    }
    throw new Error('Run not found');
  }

  // Route 11: GET /runs/:id/artifacts
  const artMatch = endpoint.match(/^\/runs\/([^/]+)\/artifacts$/);
  if (artMatch && (!options.method || options.method === 'GET')) {
    const rId = artMatch[1];
    return (store.artifacts[rId] || []) as unknown as T;
  }

  // Route 12: GET /runs/:id/repair-proposals
  const propMatch = endpoint.match(/^\/runs\/([^/]+)\/repair-proposals$/);
  if (propMatch && (!options.method || options.method === 'GET')) {
    const rId = propMatch[1];
    return (store.proposals[rId] || []) as unknown as T;
  }

  // Route 13: POST /runs/:id/repair-proposals (manual create)
  if (propMatch && options.method === 'POST') {
    const rId = propMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const newProp: RepairProposal = {
      id: `prop-${Date.now()}`,
      test_run_id: rId,
      from_version_id: 'ver-1',
      reason: body.reason || 'Manually proposed locator update',
      confidence: body.confidence || 85,
      validation_status: 'pending',
      validation_run_id: null,
      evidence_refs: [],
      created_at: new Date().toISOString(),
      proposed_plan: body.proposed_plan || { steps: [], required_assertions: [] },
    };
    if (!store.proposals[rId]) store.proposals[rId] = [];
    store.proposals[rId].unshift(newProp);
    saveStore(store);
    return newProp as unknown as T;
  }

  // Route 14: POST /runs/:id/repair-proposals/:pid/validate
  const validateMatch = endpoint.match(/^\/runs\/([^/]+)\/repair-proposals\/([^/]+)\/validate$/);
  if (validateMatch && options.method === 'POST') {
    const rId = validateMatch[1];
    const pId = validateMatch[2];
    const prop = (store.proposals[rId] || []).find((p) => p.id === pId);
    if (!prop) throw new Error('Proposal not found');
    prop.validation_status = 'validated_pass';
    saveStore(store);
    return { success: true, proposal: prop } as unknown as T;
  }

  // Route 15: POST /repair-proposals/:pid/approve (Approves and creates version v2)
  const approveMatch = endpoint.match(/^\/repair-proposals\/([^/]+)\/approve$/);
  if (approveMatch && options.method === 'POST') {
    const pid = approveMatch[1];
    let matchedProposal: RepairProposal | null = null;
    let targetRun: TestRun | null = null;

    for (const rId in store.proposals) {
      const found = store.proposals[rId].find((p) => p.id === pid);
      if (found) {
        matchedProposal = found;
        for (const tId in store.runs) {
          const r = store.runs[tId].find((run) => run.id === rId);
          if (r) {
            targetRun = r;
            break;
          }
        }
        break;
      }
    }

    if (!matchedProposal || !targetRun) {
      throw new Error('Repair proposal not found');
    }

    matchedProposal.validation_status = 'approved';

    // Upgrade test to version v2
    const testId = targetRun.test_definition_id;
    let foundTest: TestDefinition | null = null;
    for (const pId in store.tests) {
      const match = store.tests[pId].find((t) => t.id === testId);
      if (match) {
        foundTest = match;
        break;
      }
    }

    if (foundTest) {
      const newVersion: TestVersion = {
        id: `ver-v2-${Date.now()}`,
        test_definition_id: testId,
        version_number: 2,
        action_plan: matchedProposal.proposed_plan,
        assertions_snapshot: foundTest.required_assertions,
        repository_revision: 'main@self-healed-v2',
        created_at: new Date().toISOString(),
        created_by: 'GhostRunner AI (Self-Healed)',
        change_reason: matchedProposal.reason,
      };

      foundTest.active_version_id = newVersion.id;
      foundTest.current_version = newVersion;
      foundTest.updated_at = new Date().toISOString();

      // Trigger automatic re-run which passes ✅
      const rerunId = `run-v2-${Date.now()}`;
      const passedRun: TestRun = {
        id: rerunId,
        test_definition_id: testId,
        test_version_id: newVersion.id,
        owner_id: ownerId,
        status: 'passed',
        classification: null,
        confidence: 100,
        summary: 'Self-healed action plan validated: Test passed on v2 locators.',
        environment_ref: 'demo-env',
        started_at: new Date().toISOString(),
        finished_at: new Date(Date.now() + 12000).toISOString(),
        parent_run_id: targetRun.id,
        created_at: new Date().toISOString(),
        duration: '12s',
        run_number: (store.runs[testId]?.length || 0) + 1,
      };

      store.runs[testId].unshift(passedRun);
    }

    saveStore(store);
    return {
      success: true,
      message: 'Repair approved! New test version v2 created and validated.',
    } as unknown as T;
  }

  throw new Error(`Unhandled endpoint: ${endpoint}`);
}

// ── Store Reset Helper for Demo ──────────────────────────────────────────────
export function resetDemoStore(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

