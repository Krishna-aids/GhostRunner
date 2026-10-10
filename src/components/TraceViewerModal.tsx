import React, { useState } from 'react';
import { TestRun } from '../types';

interface TraceViewerModalProps {
  run: TestRun | null;
  onClose: () => void;
}

export const TraceViewerModal: React.FC<TraceViewerModalProps> = ({ run, onClose }) => {
  const [selectedStepIdx, setSelectedStepIdx] = useState(3); // default step 4 (the healed step)

  if (!run) return null;

  const currentStep = run.steps[selectedStepIdx] || run.steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[22px]">play_shapes</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-code-md text-text-primary font-bold">{run.specFile}</span>
                <span className="font-code-sm text-status-healed bg-status-healed-subtle px-1.5 py-0.5 rounded border border-status-healed/30">
                  Trace HAR Loaded
                </span>
              </div>
              <span className="text-text-muted text-xs">
                {run.traceInfo?.browser || 'Playwright Chromium Headless'} • {run.traceInfo?.viewport || '1080p'} •{' '}
                {run.traceInfo?.harSize || '4.2 MB'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Action Steps Scrubber Strip */}
        <div className="bg-surface-container-low px-space-lg py-space-sm border-b border-border-subtle overflow-x-auto flex items-center gap-2">
          {run.steps.map((st, idx) => {
            const isSelected = selectedStepIdx === idx;
            const isHealed = st.status === 'healed';
            const isFailed = st.status === 'failed';

            return (
              <button
                key={st.stepNumber}
                type="button"
                onClick={() => setSelectedStepIdx(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-label-md whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-canvas text-text-secondary hover:bg-surface-subtle border border-border-subtle'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHealed
                      ? 'bg-status-warning'
                      : isFailed
                      ? 'bg-status-failure'
                      : isSelected
                      ? 'bg-white'
                      : 'bg-status-success'
                  }`}
                ></span>
                <span>
                  Step {st.stepNumber}: {st.title.slice(0, 24)}
                  {st.title.length > 24 ? '...' : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Center Content: Replay Viewport & Telemetry */}
        <div className="flex-1 overflow-y-auto p-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          {/* Left: Reconstructed DOM Viewport Preview */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">screenshot_monitor</span>
                Simulated DOM Screenshot at Action Point
              </span>
              <span className="font-code-sm text-text-muted">Timestamp: +1.42s</span>
            </div>

            {/* Simulated browser window */}
            <div className="rounded-xl border border-border-strong bg-surface-muted overflow-hidden shadow-inner flex flex-col min-h-[300px]">
              {/* Browser window chrome */}
              <div className="bg-surface-subtle px-3 py-1.5 border-b border-border-subtle flex items-center justify-between text-[11px] font-mono text-text-muted">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="bg-surface-canvas px-3 py-0.5 rounded border border-border-subtle text-text-secondary flex-1 mx-3 truncate text-center">
                  https://staging.acme.corp/checkout/step-3
                </div>
                <span>1080p</span>
              </div>

              {/* Rendered Mock Page with Highlights */}
              <div className="p-space-lg flex-1 bg-surface-canvas flex flex-col justify-between relative">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="font-bold text-sm text-text-primary">Checkout & Order Summary</span>
                    <span className="text-xs text-text-muted">Order Total: $148.50</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-surface-subtle border">
                      <span className="font-semibold block text-text-secondary">Shipping Address</span>
                      <span className="text-text-muted">742 Evergreen Terrace, Springfield</span>
                    </div>
                    <div className="p-2 rounded bg-surface-subtle border">
                      <span className="font-semibold block text-text-secondary">Payment Method</span>
                      <span className="text-text-muted">Visa ending in •••• 4242</span>
                    </div>
                  </div>
                </div>

                {/* Target CTA element with GhostRunner target box */}
                <div className="my-6 p-4 rounded-xl border border-dashed border-status-healed bg-status-healed-subtle/30 relative flex flex-col items-center justify-center gap-2">
                  <div className="absolute -top-3 left-4 bg-status-healed text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shadow-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                    GhostRunner Autonomous Click Intercept
                  </div>

                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md ring-4 ring-status-healed/40 animate-pulse"
                  >
                    Place Order Now ($148.50)
                  </button>

                  <span className="font-code-sm text-xs text-text-secondary">
                    Actual DOM element: <code className="bg-surface-canvas px-1 rounded text-status-healed">button[data-testid="place-order-cta"]</code>
                  </span>
                </div>

                <div className="text-[11px] text-text-muted flex items-center justify-between border-t pt-2">
                  <span>Action: page.click(synthesized_locator)</span>
                  <span className="text-status-healed font-semibold">Status: 200 OK • Dispatched</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Technical Inspector & Logs */}
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="bg-surface-subtle rounded-xl p-space-md border border-border-subtle flex flex-col gap-2">
              <span className="font-label-md text-text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-status-healed">auto_fix_high</span>
                Step Execution Analysis
              </span>
              <div className="text-body-sm text-text-secondary flex flex-col gap-1">
                <div>
                  <span className="text-text-muted">Target Action: </span>
                  <span className="font-medium text-text-primary">{currentStep.title}</span>
                </div>
                <div>
                  <span className="text-text-muted">Execution Latency: </span>
                  <span className="font-mono text-text-primary">{currentStep.durationMs}ms</span>
                </div>
                {currentStep.brokenLocator && (
                  <div>
                    <span className="text-text-muted">Original broken locator: </span>
                    <code className="text-xs text-status-failure bg-surface-canvas p-0.5 rounded">
                      {currentStep.brokenLocator}
                    </code>
                  </div>
                )}
                {currentStep.healedLocator && (
                  <div>
                    <span className="text-text-muted">Healed locator: </span>
                    <code className="text-xs text-status-healed bg-surface-canvas p-0.5 rounded font-bold">
                      {currentStep.healedLocator}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* HAR Network Requests */}
            <div className="bg-surface-canvas rounded-xl p-space-md border border-border-subtle flex flex-col gap-2 shadow-xs">
              <span className="font-label-md text-text-primary font-semibold flex items-center justify-between">
                <span>Synchronous Network Calls</span>
                <span className="font-code-sm text-text-muted">3 captured</span>
              </span>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between p-1.5 rounded bg-surface-subtle">
                  <span className="text-status-success font-semibold">POST</span>
                  <span className="truncate mx-2 text-text-secondary">/api/v2/orders/create</span>
                  <span className="text-text-muted">200 OK (84ms)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-surface-subtle">
                  <span className="text-primary font-semibold">GET</span>
                  <span className="truncate mx-2 text-text-secondary">/api/v2/user/cart</span>
                  <span className="text-text-muted">200 OK (21ms)</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-surface-subtle">
                  <span className="text-status-warning font-semibold">POST</span>
                  <span className="truncate mx-2 text-text-secondary">/api/telemetry/event</span>
                  <span className="text-text-muted">204 No Content</span>
                </div>
              </div>
            </div>

            {/* Console Log for this step */}
            <div className="bg-surface-muted rounded-xl p-space-md border border-border-subtle flex flex-col gap-1">
              <span className="font-code-sm text-text-primary font-bold">Trace Debug Logs:</span>
              <div className="font-mono text-[11px] text-text-secondary space-y-1 max-h-40 overflow-y-auto">
                <p>[trace] DOM Node: attached & visible at coordinates (x: 540, y: 720)</p>
                <p className="text-status-healed">[ghostrunner] Cosine similarity matched with accessibility label "Place Order Now"</p>
                <p>[trace] Event: pointerdown -&gt; pointerup -&gt; click dispatched</p>
                <p className="text-status-success">[trace] Assert confirmation condition satisfied in 320ms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm bg-surface-subtle border-t border-border-subtle flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Trace artifact saved in Playwright format: <code className="font-mono">test-results/checkout-flow-trace.zip</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-canvas border border-border-strong text-text-primary text-xs font-label-md hover:bg-surface-container transition-colors cursor-pointer"
          >
            Close Trace Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
