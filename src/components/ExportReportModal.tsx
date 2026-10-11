import React, { useState } from 'react';
import { TestRun } from '../types';

interface ExportReportModalProps {
  testRuns: TestRun[];
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  testRuns,
  onClose,
}) => {
  const [format, setFormat] = useState<'junit' | 'json'>('junit');
  const [copied, setCopied] = useState(false);

  // Generate JUnit XML format
  const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Acme Web App Test Execution" tests="4" failures="1" healed="2" time="216.0">
  <testsuite name="checkout-suite" tests="4" failures="1" errors="0" skipped="0" time="216.0" timestamp="${new Date().toISOString()}">
    <testcase classname="test_checkout_flow.spec.ts" name="should complete checkout with saved card" time="74.0">
      <!-- GhostRunner autonomous heal: button#checkout-submit recovered to button[data-testid='place-order-cta'] (94% conf) -->
      <system-out>Autonomous Self-Healing applied: 32ms intervention latency</system-out>
    </testcase>
    <testcase classname="test_auth_sso.spec.ts" name="should redirect to Okta identity provider" time="38.0" />
    <testcase classname="test_inventory_modal.spec.ts" name="should open bulk edit modal" time="42.0">
      <failure message="TimeoutError: button.bulk-actions-trigger timed out after 3000ms" type="TimeoutError">
        Candidate button[data-action="bulk-edit"] matched at 64% similarity, below safe automated intervention threshold 70%.
      </failure>
    </testcase>
    <testcase classname="test_pricing_table.spec.ts" name="should display enterprise tier contact modal" time="62.0">
      <!-- GhostRunner autonomous heal: div.pricing-cta-enterprise recovered to button[aria-label='Contact Enterprise Sales'] (78% conf) -->
    </testcase>
  </testsuite>
</testsuites>`;

  // Generate JSON format
  const jsonReport = JSON.stringify(
    {
      reportVersion: '2.4.0',
      generatedAt: new Date().toISOString(),
      summary: {
        total: testRuns.length,
        passed: 3,
        failed: 1,
        selfHealed: 2,
        successRate: '75.0%',
        executionDurationSeconds: 216,
      },
      runs: testRuns.map((r) => ({
        id: r.id,
        spec: r.specFile,
        title: r.description,
        branch: r.branch,
        duration: r.duration,
        status: r.status,
        steps: r.steps,
      })),
    },
    null,
    2
  );

  const activeContent = format === 'junit' ? junitXml : jsonReport;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], {
      type: format === 'junit' ? 'application/xml' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostrunner-report-${format}.${format === 'junit' ? 'xml' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-canvas rounded-2xl shadow-2xl border border-border-strong w-full max-w-3xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="px-space-lg py-space-md bg-surface-subtle border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-[22px]">download</span>
            <div className="flex flex-col">
              <span className="font-headline-sm text-text-primary font-semibold">
                Export Test Report
              </span>
              <span className="text-text-muted text-xs">
                JUnit XML and JSON format for CI/CD integrations
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

        {/* Format Selector Tabs */}
        <div className="px-space-lg py-space-sm bg-surface-canvas border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-surface-muted rounded-lg">
            <button
              type="button"
              onClick={() => setFormat('junit')}
              className={`px-3 py-1 rounded-md text-xs font-label-md transition-all cursor-pointer ${
                format === 'junit'
                  ? 'bg-surface-canvas text-text-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              JUnit XML
            </button>
            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`px-3 py-1 rounded-md text-xs font-label-md transition-all cursor-pointer ${
                format === 'json'
                  ? 'bg-surface-canvas text-text-primary font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              JSON Telemetry
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container text-text-primary text-xs font-label-md transition-colors border border-border-subtle cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-label-md font-semibold hover:opacity-90 transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="p-space-lg flex-1 overflow-y-auto bg-surface-muted">
          <pre className="font-mono text-xs text-text-primary p-space-md bg-surface-canvas rounded-xl border border-border-subtle overflow-x-auto shadow-inner">
            <code>{activeContent}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-space-lg py-space-sm bg-surface-subtle border-t border-border-subtle flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-canvas border border-border-strong text-text-primary text-xs font-label-md hover:bg-surface-container transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
