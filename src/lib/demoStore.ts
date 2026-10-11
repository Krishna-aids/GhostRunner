import {
  Project,
  TestDefinition,
  TestVersion,
  TestRun,
  EvidenceArtifact,
  RepairProposal,
  ActionPlan,
} from '../types/domain';

export const DEMO_OWNER_ID = 'user-demo-1406';

const initialActionPlanV1: ActionPlan = {
  steps: [
    {
      action: 'navigate',
      target: { role: null, name: null, text: null, url: 'https://store.demo.app/cart', selector: null },
      value: null,
      timeout_ms: 5000,
    },
    {
      action: 'click',
      target: { role: null, name: null, text: null, url: null, selector: '.checkout-btn' },
      value: null,
      timeout_ms: 8000,
    },
    {
      action: 'fill',
      target: { role: 'textbox', name: 'Cardholder Name', text: null, url: null, selector: '#name' },
      value: 'Elena Rostova',
      timeout_ms: 3000,
    },
    {
      action: 'click',
      target: { role: 'button', name: 'Complete Order', text: null, url: null, selector: null },
      value: null,
      timeout_ms: 6000,
    },
  ],
  required_assertions: [
    {
      type: 'url_contains',
      target: '/order/confirmation',
      expected_value: 'true',
      description: 'Order confirmation page is displayed with receipt number',
    },
  ],
};

const initialVersionV1: TestVersion = {
  id: 'ver-v1',
  test_definition_id: 'test-checkout-flow',
  version_number: 1,
  action_plan: initialActionPlanV1,
  assertions_snapshot: initialActionPlanV1.required_assertions,
  repository_revision: 'git:main#7fc819a',
  created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  created_by: 'QA Automation Bot',
  change_reason: 'Initial test definition recorded from user intent',
};

const initialProjects: Project[] = [
  {
    id: 'proj-checkout',
    owner_id: DEMO_OWNER_ID,
    name: 'E-Commerce Checkout',
    repo_metadata: {
      github_url: 'github.com/ghoostrunner/demo-checkout-store',
      stack: 'Next.js 14 ✅',
      components_count: 23,
      routes_count: 12,
      files_count: 45,
      connected: true,
      upload_type: 'github',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'proj-saas-billing',
    owner_id: DEMO_OWNER_ID,
    name: 'SaaS Billing & Subscriptions',
    repo_metadata: {
      github_url: 'github.com/ghoostrunner/billing-portal',
      stack: 'React + Vite',
      components_count: 18,
      routes_count: 8,
      files_count: 36,
      connected: true,
      upload_type: 'zip',
    },
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

const initialTests: TestDefinition[] = [
  {
    id: 'test-checkout-flow',
    project_id: 'proj-checkout',
    owner_id: DEMO_OWNER_ID,
    name: 'Checkout Flow',
    original_intent:
      'User adds item to cart, proceeds to checkout, completes payment, lands on order confirmation page',
    required_assertions: initialActionPlanV1.required_assertions,
    preconditions: { env: 'staging', auth_required: false },
    active_version_id: 'ver-v1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    current_version: initialVersionV1,
  },
];

const initialRuns: TestRun[] = [
  {
    id: 'run-checkout-001',
    test_definition_id: 'test-checkout-flow',
    test_version_id: 'ver-v1',
    owner_id: DEMO_OWNER_ID,
    status: 'failed',
    classification: 'LOCATOR_DRIFT',
    confidence: 0.87,
    summary: 'Button selector .checkout-btn not found. Element moved.',
    environment_ref: 'demo-env',
    started_at: new Date(Date.now() - 600000).toISOString(),
    finished_at: new Date(Date.now() - 592000).toISOString(),
    parent_run_id: null,
    created_at: new Date(Date.now() - 600000).toISOString(),
    duration_ms: 8200,
  },
  {
    id: 'run-checkout-000',
    test_definition_id: 'test-checkout-flow',
    test_version_id: 'ver-v1',
    owner_id: DEMO_OWNER_ID,
    status: 'passed',
    classification: null,
    confidence: 0.99,
    summary: 'Test executed successfully without locator intervention.',
    environment_ref: 'demo-env',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    finished_at: new Date(Date.now() - 86400000 + 11200).toISOString(),
    parent_run_id: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    duration_ms: 11200,
  },
];

const initialArtifacts: Record<string, EvidenceArtifact[]> = {
  'run-checkout-001': [
    {
      id: 'art-ss-1',
      test_run_id: 'run-checkout-001',
      artifact_type: 'screenshot',
      storage_path: 'runs/run-checkout-001/failure_screenshot.png',
      metadata: { viewport: '1280x720', step: 'click_checkout_button' },
      created_at: new Date(Date.now() - 593000).toISOString(),
      url: '/mascot.png',
    },
    {
      id: 'art-console-1',
      test_run_id: 'run-checkout-001',
      artifact_type: 'console_log',
      storage_path: 'runs/run-checkout-001/console.log',
      metadata: { line_count: 5 },
      created_at: new Date(Date.now() - 593000).toISOString(),
      url: null,
    },
    {
      id: 'art-dom-1',
      test_run_id: 'run-checkout-001',
      artifact_type: 'dom_snapshot',
      storage_path: 'runs/run-checkout-001/dom_snapshot.html',
      metadata: { elements: 412 },
      created_at: new Date(Date.now() - 593000).toISOString(),
      url: '#download-dom',
    },
    {
      id: 'art-trace-1',
      test_run_id: 'run-checkout-001',
      artifact_type: 'trace',
      storage_path: 'runs/run-checkout-001/trace.zip',
      metadata: { size: '2.4MB' },
      created_at: new Date(Date.now() - 593000).toISOString(),
      url: '#download-trace',
    },
  ],
};

const initialProposals: Record<string, RepairProposal[]> = {
  'run-checkout-001': [
    {
      id: 'prop-001',
      test_run_id: 'run-checkout-001',
      from_version_id: 'ver-v1',
      proposed_plan: {
        steps: [
          {
            action: 'navigate',
            target: { role: null, name: null, text: null, url: 'https://store.demo.app/cart', selector: null },
            value: null,
            timeout_ms: 5000,
          },
          {
            action: 'click',
            target: { role: 'button', name: 'Place Order', text: null, url: null, selector: '[data-testid="place-order"]' },
            value: null,
            timeout_ms: 8000,
          },
          {
            action: 'fill',
            target: { role: 'textbox', name: 'Cardholder Name', text: null, url: null, selector: '#name' },
            value: 'Elena Rostova',
            timeout_ms: 3000,
          },
          {
            action: 'click',
            target: { role: 'button', name: 'Complete Order', text: null, url: null, selector: null },
            value: null,
            timeout_ms: 6000,
          },
        ],
        required_assertions: initialActionPlanV1.required_assertions,
      },
      reason: 'Button selector has changed: replaced brittle class .checkout-btn with semantic role="button", name="Place Order"',
      evidence_refs: ['art-ss-1', 'art-console-1'],
      confidence: 0.91,
      validation_status: 'pending',
      validation_run_id: null,
      created_at: new Date(Date.now() - 590000).toISOString(),
    },
  ],
};

class DemoStore {
  projects: Project[] = [...initialProjects];
  tests: TestDefinition[] = [...initialTests];
  runs: TestRun[] = [...initialRuns];
  artifacts: Record<string, EvidenceArtifact[]> = { ...initialArtifacts };
  proposals: Record<string, RepairProposal[]> = { ...initialProposals };
  activeOwnerId: string = DEMO_OWNER_ID;
  userEmail: string = 'krishnakumrawat1406@gmail.com';
  userName: string = 'Krishna Kumrawat';

  getProjects(ownerId?: string) {
    return this.projects;
  }

  getProject(id: string) {
    return this.projects.find((p) => p.id === id) || null;
  }

  createProject(name: string, ownerId: string) {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      owner_id: ownerId || this.activeOwnerId,
      name,
      repo_metadata: null,
      created_at: new Date().toISOString(),
    };
    this.projects = [newProject, ...this.projects];
    return newProject;
  }

  updateProjectRepo(id: string, metadata: NonNullable<Project['repo_metadata']>) {
    const proj = this.projects.find((p) => p.id === id);
    if (proj) {
      proj.repo_metadata = { ...proj.repo_metadata, ...metadata };
    }
    return proj;
  }

  getTests(projectId: string) {
    return this.tests.filter((t) => t.project_id === projectId);
  }

  getTest(id: string) {
    return this.tests.find((t) => t.id === id) || null;
  }

  createTest(projectId: string, name: string, originalIntent: string, assertionsJson: string, ownerId: string) {
    let parsedAssertions = initialActionPlanV1.required_assertions;
    try {
      if (assertionsJson.trim()) {
        parsedAssertions = JSON.parse(assertionsJson);
      }
    } catch {
      // Use fallback
    }

    const testId = `test-${Date.now()}`;
    const verId = `ver-${Date.now()}`;

    const newVersion: TestVersion = {
      id: verId,
      test_definition_id: testId,
      version_number: 1,
      action_plan: {
        steps: [
          { action: 'navigate', target: 'https://store.demo.app', value: null, timeout_ms: 5000 },
          { action: 'click', target: '.cta-button', value: null, timeout_ms: 5000 },
        ],
        required_assertions: parsedAssertions,
      },
      assertions_snapshot: parsedAssertions,
      repository_revision: 'git:main#head',
      created_at: new Date().toISOString(),
      created_by: 'User QA',
      change_reason: 'Initial test generation from natural language intent',
    };

    const newTest: TestDefinition = {
      id: testId,
      project_id: projectId,
      owner_id: ownerId || this.activeOwnerId,
      name,
      original_intent: originalIntent,
      required_assertions: parsedAssertions,
      preconditions: { env: 'demo-env' },
      active_version_id: verId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_version: newVersion,
    };

    this.tests = [newTest, ...this.tests];
    return newTest;
  }

  getRuns(testId: string) {
    return this.runs.filter((r) => r.test_definition_id === testId);
  }

  getRun(runId: string) {
    return this.runs.find((r) => r.id === runId) || null;
  }

  createRun(testId: string, ownerId: string): TestRun {
    const test = this.getTest(testId);
    const newRunId = `run-${Date.now()}`;

    const newRun: TestRun = {
      id: newRunId,
      test_definition_id: testId,
      test_version_id: test?.active_version_id || 'ver-v1',
      owner_id: ownerId || this.activeOwnerId,
      status: 'queued',
      classification: null,
      confidence: null,
      summary: 'Preparing test execution environment and browser context...',
      environment_ref: 'demo-env',
      started_at: new Date().toISOString(),
      finished_at: null,
      parent_run_id: null,
      created_at: new Date().toISOString(),
      duration_ms: 0,
    };

    this.runs = [newRun, ...this.runs];

    // Seed artifacts and proposal for this run
    this.artifacts[newRunId] = [
      {
        id: `art-ss-${newRunId}`,
        test_run_id: newRunId,
        artifact_type: 'screenshot',
        storage_path: `runs/${newRunId}/failure.png`,
        metadata: { viewport: '1280x720' },
        created_at: new Date().toISOString(),
        url: '/mascot.png',
      },
      {
        id: `art-console-${newRunId}`,
        test_run_id: newRunId,
        artifact_type: 'console_log',
        storage_path: `runs/${newRunId}/console.log`,
        metadata: {},
        created_at: new Date().toISOString(),
        url: null,
      },
    ];

    this.proposals[newRunId] = [
      {
        id: `prop-${newRunId}`,
        test_run_id: newRunId,
        from_version_id: test?.active_version_id || 'ver-v1',
        proposed_plan: {
          steps: [
            {
              action: 'navigate',
              target: { role: null, name: null, text: null, url: 'https://store.demo.app/cart', selector: null },
              value: null,
              timeout_ms: 5000,
            },
            {
              action: 'click',
              target: { role: 'button', name: 'Place Order', text: null, url: null, selector: '[data-testid="place-order"]' },
              value: null,
              timeout_ms: 8000,
            },
            {
              action: 'fill',
              target: { role: 'textbox', name: 'Cardholder Name', text: null, url: null, selector: '#name' },
              value: 'Elena Rostova',
              timeout_ms: 3000,
            },
            {
              action: 'click',
              target: { role: 'button', name: 'Complete Order', text: null, url: null, selector: null },
              value: null,
              timeout_ms: 6000,
            },
          ],
          required_assertions: test?.required_assertions || initialActionPlanV1.required_assertions,
        },
        reason: 'Button selector has changed: class .checkout-btn missing; semantic button with name "Place Order" found',
        evidence_refs: [`art-ss-${newRunId}`],
        confidence: 0.91,
        validation_status: 'pending',
        validation_run_id: null,
        created_at: new Date().toISOString(),
      },
    ];

    return newRun;
  }

  getArtifacts(runId: string): EvidenceArtifact[] {
    return this.artifacts[runId] || [];
  }

  getProposals(runId: string): RepairProposal[] {
    return this.proposals[runId] || [];
  }

  validateProposal(runId: string, proposalId: string) {
    const list = this.proposals[runId] || [];
    const p = list.find((item) => item.id === proposalId);
    if (p) {
      p.validation_status = 'validated_pass';
    }
    return p;
  }

  approveProposal(proposalId: string) {
    // Find proposal across runs
    let foundProposal: RepairProposal | null = null;
    let targetRun: TestRun | null = null;

    for (const [runId, list] of Object.entries(this.proposals)) {
      const match = list.find((item) => item.id === proposalId);
      if (match) {
        foundProposal = match;
        targetRun = this.runs.find((r) => r.id === runId) || null;
        break;
      }
    }

    if (!foundProposal || !targetRun) {
      throw new Error('Proposal not found');
    }

    foundProposal.validation_status = 'approved';

    // Create v2 TestVersion
    const test = this.tests.find((t) => t.id === targetRun!.test_definition_id);
    if (test) {
      const v2Id = `ver-v2-${Date.now()}`;
      const v2Version: TestVersion = {
        id: v2Id,
        test_definition_id: test.id,
        version_number: 2,
        action_plan: foundProposal.proposed_plan,
        assertions_snapshot: test.required_assertions,
        repository_revision: 'git:main#healed-v2',
        created_at: new Date().toISOString(),
        created_by: 'GhoostRunner AI Self-Heal',
        change_reason: 'Updated locator from brittle .checkout-btn to role: button, name: Place Order',
      };
      test.active_version_id = v2Id;
      test.current_version = v2Version;
      test.updated_at = new Date().toISOString();
    }

    // Update target run or trigger rerun to PASSED
    targetRun.status = 'rerunning';
    targetRun.summary = 'Rerunning test definition with newly approved v2 action plan...';

    setTimeout(() => {
      targetRun!.status = 'passed';
      targetRun!.summary = 'Self-healing complete! Test v1 → v2 automatically updated and passed ✅';
      targetRun!.finished_at = new Date().toISOString();
      targetRun!.confidence = 0.99;
      targetRun!.classification = null;
    }, 1200);

    return {
      success: true,
      new_version_id: test?.active_version_id,
      version_number: 2,
    };
  }
}

export const demoStore = new DemoStore();
