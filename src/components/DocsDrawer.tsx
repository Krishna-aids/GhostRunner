import React from 'react';

interface DocsDrawerProps {
  onClose: () => void;
}

export const DocsDrawer: React.FC<DocsDrawerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-surface-canvas h-full shadow-2xl border-l border-border-strong flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[24px]">menu_book</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-text-primary font-bold">
                GhostRunner v2.4 Documentation
              </span>
              <span className="text-text-muted text-xs">
                Autonomous Self-Healing Integration Guide
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

        {/* Content */}
        <div className="p-space-lg flex-1 overflow-y-auto flex flex-col gap-space-lg text-body-sm text-text-secondary">
          {/* Quickstart */}
          <div className="flex flex-col gap-2">
            <span className="font-headline-sm text-text-primary font-semibold text-sm">
              1. Quick Setup in Playwright
            </span>
            <p>
              GhostRunner attaches a lightweight CDP (Chrome DevTools Protocol) proxy layer to your Playwright runner that monitors element locators prior to throwing a TimeoutError.
            </p>
            <div className="bg-surface-muted p-space-sm rounded-lg border border-border-subtle font-mono text-xs text-text-primary">
              npm install --save-dev @ghostrunner/playwright
            </div>
          </div>

          {/* Config */}
          <div className="flex flex-col gap-2">
            <span className="font-headline-sm text-text-primary font-semibold text-sm">
              2. Configuration (<code className="text-xs">playwright.config.ts</code>)
            </span>
            <pre className="bg-surface-muted p-space-sm rounded-lg border border-border-subtle font-mono text-xs text-text-primary overflow-x-auto">
{`import { defineConfig } from '@playwright/test';
import { ghostrunner } from '@ghostrunner/playwright';

export default defineConfig({
  reporter: [
    ['list'],
    ['@ghostrunner/playwright/reporter', {
      apiKey: process.env.GHOSTRUNNER_API_KEY,
      autoHeal: true,
      confidenceThreshold: 0.70, // default 70%
      generatePullRequests: true,
    }],
  ],
});`}
            </pre>
          </div>

          {/* How self-healing works */}
          <div className="flex flex-col gap-2">
            <span className="font-headline-sm text-text-primary font-semibold text-sm">
              3. How Dynamic Recovery Works
            </span>
            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
              <li>
                <strong>DOM Mutation Fingerprinting:</strong> When a selector like <code className="text-xs bg-surface-subtle px-1 rounded">button#checkout-submit</code> fails to resolve within timeout, GhostRunner pauses the pointer event and builds an accessibility sub-tree of the active frame.
              </li>
              <li>
                <strong>Neural Embeddings & Sibling Correlation:</strong> Evaluates text labels, ARIA attributes, bounding client rects, and semantic form roles to calculate cosine similarity with the target element.
              </li>
              <li>
                <strong>Zero Halt Execution:</strong> If the best candidate scores &ge; 70%, GhostRunner dynamically mutates the active action locator and completes the test without failing your CI pipeline.
              </li>
              <li>
                <strong>Healing Queue Triage:</strong> The healed selector is synced to this dashboard so your team can 1-click review and push code updates upstream.
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="p-space-md rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[22px]">support_agent</span>
            <div className="flex flex-col">
              <span className="font-label-md text-text-primary font-semibold">
                Dedicated Enterprise Support
              </span>
              <span className="text-xs text-text-secondary mt-0.5">
                Elena Rostova & GhostRunner Solutions Engineering are available 24/7 on Slack <code className="bg-surface-canvas px-1 rounded">#ghostrunner-support</code>.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm bg-surface-subtle border-t border-border-subtle flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-canvas border border-border-strong text-text-primary text-xs font-label-md hover:bg-surface-container transition-colors cursor-pointer"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
