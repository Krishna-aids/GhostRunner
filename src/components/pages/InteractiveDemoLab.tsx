import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Terminal,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  Sliders,
} from 'lucide-react';

type DemoVersion = 'version_a' | 'version_b' | 'version_c';

interface StepResult {
  step: number;
  name: string;
  action: string;
  target: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
  duration?: number;
}

export const InteractiveDemoLab: React.FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<DemoVersion>('version_a');
  const [isRunning, setIsRunning] = useState(false);
  const [activePlanVersion, setActivePlanVersion] = useState<'v1' | 'v2'>('v1');
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [repairProposed, setRepairProposed] = useState(false);
  const [repairApproved, setRepairApproved] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);

  // Simulation execution steps
  const [steps, setSteps] = useState<StepResult[]>([
    {
      step: 1,
      name: 'Navigate to Cart',
      action: 'navigate',
      target: 'https://store.ghostrunner.demo/cart',
      status: 'pending',
    },
    {
      step: 2,
      name: 'Submit Checkout',
      action: 'click',
      target: '#checkout-btn',
      status: 'pending',
    },
    {
      step: 3,
      name: 'Verify Order Confirmation',
      action: 'assert_visible',
      target: 'text="Order confirmed"',
      status: 'pending',
    },
  ]);

  const [classification, setClassification] = useState<{
    category: 'PASSED' | 'LOCATOR_DRIFT' | 'API_FAILURE' | null;
    confidence: number;
    reason: string;
  } | null>(null);

  const resetSimulation = (ver: DemoVersion = selectedVersion) => {
    setSelectedVersion(ver);
    setIsRunning(false);
    setActivePlanVersion('v1');
    setOrderStatus(null);
    setRepairProposed(false);
    setRepairApproved(false);
    setClassification(null);
    setRunLog([]);
    setSteps([
      {
        step: 1,
        name: 'Navigate to Cart',
        action: 'navigate',
        target: 'https://store.ghostrunner.demo/cart',
        status: 'pending',
      },
      {
        step: 2,
        name: 'Submit Checkout',
        action: 'click',
        target: '#checkout-btn',
        status: 'pending',
      },
      {
        step: 3,
        name: 'Verify Order Confirmation',
        action: 'assert_visible',
        target: 'text="Order confirmed"',
        status: 'pending',
      },
    ]);
  };

  const runTest = async (overridePlanVer?: 'v1' | 'v2') => {
    const currentPlan = overridePlanVer || activePlanVersion;
    setIsRunning(true);
    setClassification(null);
    setRepairProposed(false);
    setOrderStatus(null);

    const log = (msg: string) => setRunLog((prev) => [...prev, msg]);
    setRunLog([
      `[INIT] Starting headless test runner for ${selectedVersion.toUpperCase()}...`,
      `[SPEC] Intent: "Complete checkout with a valid credit card."`,
      `[PLAN] Loaded Action Plan ${currentPlan.toUpperCase()}`,
    ]);

    // Step 1: Navigate
    setSteps((s) =>
      s.map((st) => (st.step === 1 ? { ...st, status: 'running' } : { ...st, status: 'pending' }))
    );
    await new Promise((r) => setTimeout(r, 600));
    setSteps((s) =>
      s.map((st) => (st.step === 1 ? { ...st, status: 'passed', duration: 320 } : st))
    );
    log(`[STEP 1] Navigate to store cart -> 200 OK (320ms)`);

    // Step 2: Click
    const targetSelector =
      currentPlan === 'v2'
        ? 'role="button", name="Complete Order"'
        : '#checkout-btn';

    setSteps((s) =>
      s.map((st) =>
        st.step === 2
          ? { ...st, target: targetSelector, status: 'running' }
          : st
      )
    );
    await new Promise((r) => setTimeout(r, 900));

    if (selectedVersion === 'version_a') {
      // Version A: #checkout-btn exists
      setSteps((s) =>
        s.map((st) => (st.step === 2 ? { ...st, status: 'passed', duration: 410 } : st))
      );
      log(`[STEP 2] Click '#checkout-btn' -> Element resolved & clicked (410ms)`);

      // Step 3: Assertion
      setSteps((s) =>
        s.map((st) => (st.step === 3 ? { ...st, status: 'running' } : st))
      );
      await new Promise((r) => setTimeout(r, 600));
      setOrderStatus('Order confirmed: #ORD-78921');
      setSteps((s) =>
        s.map((st) => (st.step === 3 ? { ...st, status: 'passed', duration: 250 } : st))
      );
      log(`[STEP 3] Assertion 'Order confirmed' found in #status banner -> PASS`);
      log(`[VERDICT] Test run completed successfully with status: PASSED`);
      setClassification({
        category: 'PASSED',
        confidence: 0.99,
        reason: 'All actions completed cleanly and immutable assertions were verified.',
      });
      setIsRunning(false);
      return;
    }

    if (selectedVersion === 'version_b') {
      if (currentPlan === 'v1') {
        // Version B with v1 plan: fails because button renamed and ID changed
        setSteps((s) =>
          s.map((st) =>
            st.step === 2
              ? {
                  ...st,
                  status: 'failed',
                  error: 'TimeoutError: locator("#checkout-btn") not found after 5000ms',
                }
              : st
          )
        );
        log(`[STEP 2 FAIL] locator("#checkout-btn") timed out. Element missing from DOM.`);
        log(`[ANALYZER] Collecting multi-modal runtime evidence (DOM tree, network trace, screenshot)...`);
        await new Promise((r) => setTimeout(r, 600));

        log(`[CLASSIFY] Rule 3 triggered: LOCATOR_DRIFT detected (Confidence: 94%)`);
        log(`[INTENT ENGINE] Searching DOM for elements fulfilling intent: "Complete checkout"`);
        log(`[MATCH FOUND] <button id="complete-order-btn">Complete Order</button> (Semantic match: 95%)`);

        setClassification({
          category: 'LOCATOR_DRIFT',
          confidence: 0.94,
          reason:
            'Button selector "#checkout-btn" not found. Semantic DOM analysis detected renamed control "Complete Order" (<button id="complete-order-btn">).',
        });
        setRepairProposed(true);
        setIsRunning(false);
        return;
      } else {
        // Version B with v2 repaired plan: passes!
        setSteps((s) =>
          s.map((st) => (st.step === 2 ? { ...st, status: 'passed', duration: 380 } : st))
        );
        log(`[STEP 2 REPAIRED] Click role="button", name="Complete Order" -> Clicked! (380ms)`);

        // Step 3
        setSteps((s) =>
          s.map((st) => (st.step === 3 ? { ...st, status: 'running' } : st))
        );
        await new Promise((r) => setTimeout(r, 600));
        setOrderStatus('Order confirmed: #ORD-78921');
        setSteps((s) =>
          s.map((st) => (st.step === 3 ? { ...st, status: 'passed', duration: 220 } : st))
        );
        log(`[STEP 3] Assertion 'Order confirmed' matched! Immutable intent verified.`);
        log(`[VERDICT] Self-healing test v2 PASSED!`);
        setClassification({
          category: 'PASSED',
          confidence: 0.98,
          reason: 'Repaired plan v2 successfully verified all original assertions.',
        });
        setIsRunning(false);
        return;
      }
    }

    if (selectedVersion === 'version_c') {
      // Version C: Click succeeds, but API returns 500
      setSteps((s) =>
        s.map((st) => (st.step === 2 ? { ...st, status: 'passed', duration: 420 } : st))
      );
      log(`[STEP 2] Click target -> Succeeded. Button exists.`);

      setSteps((s) =>
        s.map((st) => (st.step === 3 ? { ...st, status: 'running' } : st))
      );
      await new Promise((r) => setTimeout(r, 800));

      setOrderStatus('Checkout failed: 500 Internal Server Error');
      setSteps((s) =>
        s.map((st) =>
          st.step === 3
            ? {
                ...st,
                status: 'failed',
                error: 'Assertion failed: expected "Order confirmed", got "Checkout failed"',
              }
            : st
        )
      );
      log(`[NETWORK EVENT] POST /api/checkout returned HTTP 500 Internal Server Error`);
      log(`[STEP 3 FAIL] Required assertion 'Order confirmed' was not met`);
      log(`[CLASSIFY] Rule 1 triggered: API_FAILURE (500 Server Error)`);
      log(`[INTEGRITY GUARD] Strict policy enforced: Genuine API defects MUST NOT be auto-healed.`);

      setClassification({
        category: 'API_FAILURE',
        confidence: 0.96,
        reason:
          'Backend returned HTTP 500 on /api/checkout. This is a genuine functional regression, NOT locator drift. Auto-healing refused.',
      });
      setIsRunning(false);
    }
  };

  const handleApproveRepair = async () => {
    setActivePlanVersion('v2');
    setRepairApproved(true);
    setRepairProposed(false);
    await runTest('v2');
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Live Interactive Lab
            </span>
            <span className="text-xs font-mono text-text-muted">GhostRunner v2.4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Self-Healing Intent Engine
          </h1>
          <p className="text-sm text-text-secondary max-w-2xl">
            Experience how intent-aware testing survives interface changes. Witness GhostRunner
            diagnose locator drift, reconstruct actions from original intent, and strictly refuse
            to heal genuine application failures.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => resetSimulation()}
            className="px-3.5 py-2 rounded-xl border border-border-subtle bg-surface-canvas text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </div>

      {/* Target Application Revisions Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => {
            resetSimulation('version_a');
          }}
          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedVersion === 'version_a'
              ? 'bg-surface-canvas border-primary shadow-md ring-1 ring-primary/30'
              : 'bg-surface-subtle/50 border-border-subtle hover:bg-surface-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              VERSION A
            </span>
            {selectedVersion === 'version_a' && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Baseline Store</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Original DOM: <code>#checkout-btn</code> with "Checkout". API returns 200 OK.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            Expected: Direct Pass
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetSimulation('version_b');
          }}
          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedVersion === 'version_b'
              ? 'bg-surface-canvas border-primary shadow-md ring-1 ring-primary/30'
              : 'bg-surface-subtle/50 border-border-subtle hover:bg-surface-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 font-mono">
              VERSION B
            </span>
            {selectedVersion === 'version_b' && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">UI Redesign Drift</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Renamed button: "Complete Order" (<code>#complete-order-btn</code>). Stale v1 plan breaks.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-violet-400 flex items-center gap-1">
            Expected: Auto-Heal (v1 → v2)
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            resetSimulation('version_c');
          }}
          className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedVersion === 'version_c'
              ? 'bg-surface-canvas border-primary shadow-md ring-1 ring-primary/30'
              : 'bg-surface-subtle/50 border-border-subtle hover:bg-surface-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">
              VERSION C
            </span>
            {selectedVersion === 'version_c' && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Real 500 API Defect</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Locator intact, but <code>POST /api/checkout</code> returns 500 error.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
            Expected: Refuse False Healing
          </span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Target Store View & Stepper */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Target App Simulation Card */}
          <div className="p-5 rounded-2xl bg-surface-canvas border border-border-subtle shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                Target Store Preview
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle text-text-muted">
                Action Plan: {activePlanVersion.toUpperCase()}
              </span>
            </div>

            {/* Target App Cart Preview */}
            <div className="p-4 rounded-xl bg-surface-subtle/70 border border-border-subtle flex flex-col gap-3 max-w-md mx-auto w-full">
              <div className="flex justify-between items-center text-xs text-text-secondary pb-2 border-b border-border-subtle">
                <span className="font-bold text-text-primary">Cart Overview</span>
                <span className="font-mono text-[11px] text-text-muted">Rev: {selectedVersion.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Cloud Pro Membership</span>
                <span className="font-semibold text-text-primary">$120.00</span>
              </div>

              {/* Mutating Button */}
              {selectedVersion === 'version_b' ? (
                <button
                  type="button"
                  id="complete-order-btn"
                  className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Complete Order
                </button>
              ) : (
                <button
                  type="button"
                  id="checkout-btn"
                  className="w-full py-2.5 rounded-lg bg-primary hover:opacity-90 text-on-primary font-semibold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Checkout
                </button>
              )}

              {/* Order Status Result */}
              {orderStatus && (
                <div
                  id="status"
                  className={`p-2.5 rounded-lg text-center text-xs font-semibold ${
                    orderStatus.includes('confirmed')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {orderStatus}
                </div>
              )}
            </div>

            {/* Run Button Bar */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
              <div className="text-xs text-text-muted">
                Intent: <span className="text-text-primary font-medium">"Complete checkout with valid payment"</span>
              </div>
              <button
                type="button"
                onClick={() => runTest()}
                disabled={isRunning}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Execute Plan ({activePlanVersion.toUpperCase()})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stepper Card */}
          <div className="p-4 rounded-2xl bg-surface-canvas border border-border-subtle shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Plan Steps
            </h3>

            <div className="flex flex-col gap-2">
              {steps.map((st) => (
                <div
                  key={st.step}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                    st.status === 'passed'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : st.status === 'failed'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : st.status === 'running'
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-surface-subtle/40 border-border-subtle text-text-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border border-current">
                      {st.step}
                    </span>
                    <div>
                      <div className="font-semibold text-xs">{st.name}</div>
                      <div className="font-mono text-[11px] opacity-80">{st.target}</div>
                      {st.error && <div className="text-[11px] text-rose-400 mt-1 font-mono">{st.error}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    {st.status === 'passed' && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {st.duration ? `${st.duration}ms` : 'PASS'}
                      </span>
                    )}
                    {st.status === 'failed' && (
                      <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        FAIL
                      </span>
                    )}
                    {st.status === 'running' && (
                      <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        RUNNING
                      </span>
                    )}
                    {st.status === 'pending' && <span className="text-[11px] text-text-muted">QUEUED</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repair Proposal Card */}
          {repairProposed && (
            <div className="p-4 rounded-2xl bg-violet-950/30 border border-violet-500/40 flex flex-col gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-bold text-xs uppercase tracking-wider">
                  Self-Healing Engine Proposes Minimal Repair
                </h4>
              </div>

              <div className="text-xs text-text-secondary flex flex-col gap-1.5">
                <p>
                  GhostRunner inspected the failure evidence and discovered element drift from{' '}
                  <code className="text-rose-400 font-mono">#checkout-btn</code> to{' '}
                  <code className="text-emerald-400 font-mono">Complete Order</code>.
                </p>
                <div className="p-2.5 rounded-lg bg-surface-canvas border border-border-subtle font-mono text-[11px]">
                  <div className="text-text-muted">Proposed Test Version: v2</div>
                  <div className="text-rose-400">- click: #checkout-btn ("Checkout")</div>
                  <div className="text-emerald-400">+ click: role="button", name="Complete Order"</div>
                  <div className="text-text-secondary mt-1">Assertion: 'Order confirmed' (UNCHANGED)</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApproveRepair}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-xs shadow-md hover:bg-violet-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Approve Repair & Re-run in Sandbox (Bump Version v1 → v2)
              </button>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Diagnostic Terminal & Classification */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Terminal Console */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Terminal className="w-3.5 h-3.5" />
                Live Engine Console
              </span>
              <span>Headless Runner</span>
            </div>

            <div className="h-64 overflow-y-auto flex flex-col gap-1 text-[11px] leading-relaxed">
              {runLog.length === 0 ? (
                <div className="text-slate-600 italic">Click "Execute Plan" to run simulation...</div>
              ) : (
                runLog.map((l, i) => {
                  const isPass = l.includes('PASSED') || l.includes('PASS');
                  const isFail = l.includes('FAIL') || l.includes('FAILED');
                  const isWarn = l.includes('CLASSIFY') || l.includes('LOCATOR_DRIFT') || l.includes('MATCH');
                  return (
                    <div
                      key={i}
                      className={
                        isPass
                          ? 'text-emerald-400'
                          : isFail
                          ? 'text-rose-400'
                          : isWarn
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {l}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Classification Verdict */}
          {classification && (
            <div
              className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                classification.category === 'PASSED'
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : classification.category === 'LOCATOR_DRIFT'
                  ? 'bg-violet-950/30 border-violet-500/40'
                  : 'bg-rose-950/30 border-rose-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Classification Diagnostic
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-canvas text-text-secondary">
                  Confidence: {Math.round(classification.confidence * 100)}%
                </span>
              </div>
              <div className="text-xs font-semibold text-text-primary">
                Category: {classification.category}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                {classification.reason}
              </p>
            </div>
          )}

          {/* Core Invariants */}
          <div className="p-4 rounded-2xl bg-surface-canvas border border-border-subtle flex flex-col gap-2 text-xs">
            <span className="font-bold text-[11px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              GhostRunner Invariants
            </span>
            <div className="flex flex-col gap-1.5 text-text-muted">
              <div>✓ <strong className="text-text-primary">Immutable Intent:</strong> Original business purpose is write-once.</div>
              <div>✓ <strong className="text-text-primary">No False Healing:</strong> 500s & regressions are strictly refused.</div>
              <div>✓ <strong className="text-text-primary">Assertions Intact:</strong> Verification checks are never deleted.</div>
              <div>✓ <strong className="text-text-primary">Append-Only:</strong> Fixes create audited v1 → v2 rows in DB.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
