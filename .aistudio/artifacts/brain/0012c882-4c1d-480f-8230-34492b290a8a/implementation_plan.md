# GhostRunner — Intent-Aware Self-Healing E2E Testing Platform

Architectural blueprint and demo walkthrough plan for GhostRunner's 5 core specification pages (`/login`, `/projects`, `/projects/:id`, `/tests/:id`, `/runs/:id`), implementing the complete self-healing test loop with live execution timeline, locator drift classification, AI repair proposals, and instant re-run validation blended into the existing platform suite.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during interactive clarification and form the foundation of this build:

- **Confirmed: Hybrid API Client & Demo Fallback**: All API calls use standard endpoints (`GET /projects`, `POST /projects/{id}/repository`, `POST /tests/{id}/runs`, `POST /repair-proposals/{pid}/approve`) with `X-Owner-ID` header. If a live backend server URL (`VITE_API_BASE_URL`) is not reachable or during demo rehearsals, the client automatically executes realistic state transitions so the full 3-minute hackathon demo script never fails or hangs.
- **Confirmed: Seamless Blended Experience**: The 5 core specification views (`/login`, `/projects`, `/projects/:id`, `/tests/:id`, `/runs/:id`) are established as top-level routed views, with a clean topbar breadcrumb navigation, while preserving instant access to GhostRunner's existing companion tools (Telemetry Cards, Healing Queue, Trace Viewer, and Mascot Assistant).
- **Confirmed: Supabase Auth with Instant Demo Bypass**: Clean Google sign-in UI with Supabase OAuth integration and a 1-click "Continue as Demo Engineer" bypass that seeds a persistent `owner_id` (`demo-user-1406`) for immediate live presentation.

---

## 1. Overview & Core Concept

- **What It Does**: GhostRunner is an intent-aware, self-healing end-to-end testing platform. When frontend UI changes cause automated locators or assertions to break (e.g., CSS class renames or button DOM structure changes), GhostRunner detects locator drift, analyzes DOM and console logs, generates a structured AI repair proposal (shifting from brittle selectors to semantic role/name pairs), and allows users to approve the fix to create version `v2`, immediately rerunning the test to green.
- **Target Audience / Persona**: Frontend and QA engineers presenting at hackathons and CI/CD automation teams tired of flaky E2E tests breaking builds.
- **Key Value**: Closes the loop from test failure to automated self-healing without requiring engineers to manually re-record or edit brittle selector code.

---

## 2. User Experience & Visual Design

### Key User Flows (3-Minute Hackathon Demo Script)

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
│ 1. /login    │ ──> │ 2. /projects │ ──> │ 3. /projects/:id     │
│ Google Auth  │     │ Create Proj  │     │ Connect Repo / ZIP  │
└──────────────┘     └──────────────┘     └──────────┬──────────┘
                                                     │
                                                     ▼
┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
│ 5b. v2 Pass  │ <── │ 5. /runs/:id │ <── │ 4. /tests/:id       │
│ Healed Green │     │ AI Repair    │     │ ▶ Run Test & Live   │
│ Rerun Passes │     │ Approve v2   │     │ Stepper Timeline    │
└──────────────┘     └──────────────┘     └─────────────────────┘
```

1. **Step 1 — Login (`/login`)**:
   - Clean dark-slate card centered on screen with GhostRunner wordmark and tagline *"Intent-Aware Self-Healing E2E Testing"*.
   - Primary `Continue with Google` button with official Google emblem.
   - Demo bypass pill link *"Continue as Demo QA Lead (Instant Demo)"*.
   - On click: Generates authenticated session, sets `X-Owner-ID: user-demo-1406`, and transitions to `/projects`.

2. **Step 2 — Projects Dashboard (`/projects`)**:
   - Top bar with "My Projects" heading and `+ New Project` button.
   - 2-column project cards grid displaying name, connected repository badge, created date, and "Open →" link.
   - New Project Dialog modal with project name input and validation.
   - Includes seeded demo project *"E-Commerce Checkout"* ready for live presentation.

3. **Step 3 — Project Detail & Repository Inspection (`/projects/:id`)**:
   - **Section A (Repository Connection)**: Dual mode interface for connecting GitHub (`github.com/owner/repo` with instant connected status) or uploading a project ZIP archive.
   - Displays real-time inspection card: `Stack: Next.js 14 ✅ | Components: 23 | Routes: 12 | Files: 45`.
   - **Section B (Tests List)**: Displays `TestDefinitionCard` list with name, original intent description, and active version badge (`v1`). Includes `+ New Test` modal with original intent textarea and required assertions JSON builder.

4. **Step 4 — Test Detail & Live Run Stepper (`/tests/:id`)**:
   - Test header with original intent, version tag (`v1`), and large green `▶ Run Test` CTA.
   - **Live Run Panel**: Appears upon trigger with live pulsing badge and animated step timeline:
     $$\text{QUEUED} \longrightarrow \text{PREPARING} \longrightarrow \text{RUNNING} \longrightarrow \text{COLLECTING\_EVIDENCE} \longrightarrow \text{CLASSIFYING}$$
   - Run history table listing past runs with classification, duration, and direct "View Run →" links.

5. **Step 5 — Run Detail, Evidence Gallery & Self-Healing Approval (`/runs/:id`)**:
   - **Section A (Run Overview)**: Large status badge (`FAILED`), failure classification chip (`🔴 LOCATOR_DRIFT`), 87% confidence meter, and failure summary: *"Button selector .checkout-btn not found. Element moved in DOM."*
   - **Section B (Evidence Gallery)**: Screenshot carousel with click-to-zoom modal, interactive terminal console log pre-formatted container, and download links for DOM snapshots and Playwright traces.
   - **Section C (Repair Panel & Approval Flow)**: Amber repair proposal card detailing reason, 91% confidence, and JSON action plan showing replacement of `.checkout-btn` with `role: "button", name: "Place Order"`.
   - Clicking `✅ Approve` opens the version confirmation modal: *"Approve repair? This will create Test Version v2 and trigger automated re-validation."*
   - Approval triggers automated rerun: timeline transitions through `RERUNNING` $\rightarrow$ `PASSED ✅` with toast notification *"✅ Repair approved! Test v1 → v2 automatically updated and passed."*

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: High-density engineering console with clean dark/light theme fidelity, monospace tabular numerals, and restrained color distribution.
- **Color Discipline (60-30-10)**:
  - 60% Canvas: Neutral dark slate `#0a0a0a` / Clean white `#ffffff`.
  - 30% Structural Surfaces: `#121212` / `#f8fafc` containers with hairline borders (`#222222` / `#e2e8f0`).
  - 10% Accent Budget: Semantic status colors:
    - *Queued / Gray*: `#64748b`
    - *Running / Blue*: `#2563eb` with pulse animation
    - *Collecting Evidence / Indigo*: `#6366f1`
    - *Classifying / Purple*: `#a855f7`
    - *Repair Proposed / Amber*: `#f59e0b`
    - *Passed / Emerald*: `#10b981`
    - *Failed / Rose*: `#ef4444`
- **Typography**: Clean display headings paired with `font-mono tabular-nums` for durations, confidence percentages, and timestamps. Zero pill sandwiches, clean unboxed metadata with `·` separators.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Path URL Navigation with In-App Router**:
  - *Approach*: Implement an active route manager supporting `/login`, `/projects`, `/projects/:id`, `/tests/:id`, `/runs/:id`, while syncing browser `window.location` history and URL parameters.
  - *Why*: Allows exact URL sharing and matches the specification's 5 routing targets while maintaining instant compatibility with the preview dev server.
- **Decision 2: Domain-Driven Shared Components Hierarchy**:
  - *Approach*: Build dedicated shared components (`RunStatusBadge`, `FailureCategoryChip`, `RunTimeline`, `RepairProposalCard`, `AppLayout`) in strict alignment with Section 7 of the specification before wiring the pages.
  - *Why*: Ensures consistent styling across test detail, run history, and repair panels without code duplication.
- **Decision 3: Resilience Layer for Demo Success**:
  - *Approach*: Wrap `apiFetch` in an intelligent fallback layer. If `process.env.VITE_API_BASE_URL` is unavailable or returns network failure, it simulates the backend sequence with exact timings specified in the demo script (2-second polling intervals and realistic status transitions).
  - *Why*: Hackathon presentations frequently suffer from backend disconnects or flaky Wi-Fi; this guarantees a flawless 3-minute demo execution while remaining 100% compatible with real backend instances.

---

## 4. Technical Architecture & Data Strategy

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              AppLayout                                 │
│  ┌───────────────────────┬──────────────────────────────────────────┐  │
│  │ Topbar                │ Breadcrumbs | ThemeToggle | UserProfile  │  │
│  └───────────────────────┴──────────────────────────────────────────┘  │
│  ┌───────────────────────┬──────────────────────────────────────────┐  │
│  │ Active Router View    │                                          │  │
│  │                       │ 1. LoginPage (/login)                    │  │
│  │                       │ 2. ProjectsPage (/projects)              │  │
│  │                       │ 3. ProjectDetailPage (/projects/:id)     │  │
│  │                       │ 4. TestDetailPage (/tests/:id)           │  │
│  │                       │ 5. RunDetailPage (/runs/:id)             │  │
│  │                       │                                          │  │
│  └───────────────────────┴──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Shared Component Layer                                           │  │
│  │ RunStatusBadge | FailureCategoryChip | RunTimeline | RepairCard  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ API & Store Engine (api.ts + demoSimulationStore.ts)             │  │
│  │ X-Owner-ID Header | SWR Cache | Supabase Auth State              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models & Types (`src/types/domain.ts`)

Mirroring specification enums and structures:
- `RunStatus`: `'queued' | 'preparing' | 'running' | 'collecting_evidence' | 'classifying' | 'repair_proposed' | 'rerunning' | 'passed' | 'failed' | 'needs_review' | 'environment_failed'`
- `FailureCategory`: `'LOCATOR_DRIFT' | 'UI_FUNCTIONAL_REGRESSION' | 'API_FAILURE' | 'CONTRACT_MISMATCH' | 'ASSERTION_FAILURE' | 'ENVIRONMENT_FAILURE' | 'AMBIGUOUS_REQUIRES_REVIEW'`
- `ArtifactType`: `'screenshot' | 'trace' | 'dom_snapshot' | 'console_log' | 'network_log' | 'report' | 'repair_candidate' | 'accessibility_snapshot'`
- `RepairValidationStatus`: `'pending' | 'validating' | 'validated_pass' | 'validated_fail' | 'approved' | 'rejected'`
- Complete interfaces for `Project`, `TestDefinition`, `TestVersion`, `TestRun`, `EvidenceArtifact`, `RepairProposal`, `ActionPlan`, and `RequiredAssertion`.

### Interactive Component & State Mapping

1. **`LoginPage`**:
   - `onGoogleLogin()`: Triggers Supabase OAuth client or generates demo session with toast confirmation.
   - Transitions directly to `/projects`.
2. **`ProjectsPage`**:
   - `onCreateProject(name)`: Validates name (1–255 characters), submits `POST /projects`, invalidates project list cache, shows success toast.
   - `onSelectProject(id)`: Navigates to `/projects/${id}`.
3. **`ProjectDetailPage`**:
   - `onConnectGitHub(url)`: Updates `repo_metadata.github_url`, renders green verified badge.
   - `onUploadZip(file)`: Sends multipart form data to `POST /projects/${id}/repository`, reveals inspection card with component/route counts.
   - `onCreateTest(name, intent, assertions)`: Submits `POST /projects/${id}/tests`, appends to test definition cards.
4. **`TestDetailPage`**:
   - `onRunTest()`: Submits `POST /tests/${id}/runs` with `{ environment_ref: "demo-env" }`. Initiates live run stepper polling (`refreshInterval: 2000`).
   - `RunTimeline`: Displays active state pulsing node across the 5 pipeline stages.
5. **`RunDetailPage`**:
   - `onZoomScreenshot(url)`: Opens lightweight modal lightbox.
   - `onValidateRepair(proposalId)`: Triggers `POST /runs/${id}/repair-proposals/${proposalId}/validate`.
   - `onApproveRepair(proposalId)`: Displays modal confirmation $\rightarrow$ triggers `POST /repair-proposals/${proposalId}/approve` $\rightarrow$ updates version to `v2` and initiates rerun to green.

---

## 5. Execution Steps

1. **Step 1: Domain Models & API Client**: Create `src/types/domain.ts` and `src/lib/api.ts` with `X-Owner-ID` support and resilient demo execution fallback.
2. **Step 2: Core Shared Components**: Create `RunStatusBadge`, `FailureCategoryChip`, `RunTimeline`, and `RepairProposalCard` with standard color tokens and WCAG AA contrast.
3. **Step 3: Five Specification Pages**:
   - Implement `LoginPage` (`/login`).
   - Implement `ProjectsPage` (`/projects`) with create modal.
   - Implement `ProjectDetailPage` (`/projects/:id`) with GitHub connect, ZIP upload, and tests list.
   - Implement `TestDetailPage` (`/tests/:id`) with live execution stepper and run history.
   - Implement `RunDetailPage` (`/runs/:id`) with evidence gallery, console viewer, and self-healing approval flow.
4. **Step 4: Router & Layout Blending**: Update `App.tsx` and `AppLayout.tsx` to handle route paths seamlessly while retaining access to the companion dashboard and mascot.
5. **Step 5: End-to-End Verification**: Verify the complete 3-minute hackathon demo walkthrough script and ensure clean TypeScript compilation with zero errors.
