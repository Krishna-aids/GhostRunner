import React, { useState, useMemo } from 'react';
import { TestRun } from '../types';

interface TestRunsTableProps {
  testRuns: TestRun[];
  onRerunTest: (runId: string) => void;
  onOpenTrace: (run: TestRun) => void;
  onViewInHealingQueue: (specFile: string) => void;
  onInvestigate: (run: TestRun) => void;
  selectedEnv: string;
}

export const TestRunsTable: React.FC<TestRunsTableProps> = ({
  testRuns,
  onRerunTest,
  onOpenTrace,
  onViewInHealingQueue,
  onInvestigate,
  selectedEnv,
}) => {
  // Search query & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healed' | 'passed' | 'failed'>('all');
  const [timeframe, setTimeframe] = useState<'7d' | '24h' | '30d'>('7d');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  // Expanded rows set - default row-1 expanded
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    'run-1': true,
  });

  // Technical details toggle for row 1 & others
  const [expandedTechDetails, setExpandedTechDetails] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleTech = (id: string) => {
    setExpandedTechDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return testRuns.filter((run) => {
      // search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        run.specFile.toLowerCase().includes(q) ||
        run.description.toLowerCase().includes(q) ||
        run.branch.toLowerCase().includes(q) ||
        (run.steps.some(
          (s) =>
            s.brokenLocator?.toLowerCase().includes(q) ||
            s.healedLocator?.toLowerCase().includes(q) ||
            s.errorMessage?.toLowerCase().includes(q)
        ));

      // status
      let matchesStatus = true;
      if (statusFilter === 'healed') {
        matchesStatus = run.status === 'healed_passed';
      } else if (statusFilter === 'passed') {
        matchesStatus = run.status === 'passed';
      } else if (statusFilter === 'failed') {
        matchesStatus = run.status === 'failed';
      }

      return matchesSearch && matchesStatus;
    });
  }, [testRuns, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col gap-space-md">
      {/* Table Toolbar */}
      <div className="bg-surface-canvas rounded-xl p-space-sm shadow-sm border border-border-subtle/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-subtle font-body-md text-body-md text-text-primary placeholder:text-text-muted focus:bg-surface-canvas focus:outline-none focus:ring-2 focus:ring-primary-container border border-transparent focus:border-border-subtle transition-all"
            placeholder="Search test runs by file, test case name, or error..."
            type="text"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters right side */}
        <div className="flex items-center flex-wrap gap-space-xs">
          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-subtle text-text-primary font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-secondary">
                filter_list
              </span>
              <span>
                {statusFilter === 'all'
                  ? 'All Statuses'
                  : statusFilter === 'healed'
                  ? 'Healed & Passed'
                  : statusFilter === 'passed'
                  ? 'Passed'
                  : 'Failed'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-text-muted">
                arrow_drop_down
              </span>
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-1 w-44 bg-surface-canvas border border-border-strong rounded-xl shadow-lg z-30 p-1 flex flex-col gap-0.5">
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'healed', label: 'Healed & Passed' },
                  { id: 'passed', label: 'Passed Only' },
                  { id: 'failed', label: 'Failed Only' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st.id as any);
                      setStatusDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left font-label-md rounded-lg text-body-sm transition-colors ${
                      statusFilter === st.id
                        ? 'bg-primary-container text-on-primary font-medium'
                        : 'hover:bg-surface-subtle text-text-primary'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="relative">
            <button
              onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-subtle text-text-primary font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-secondary">
                calendar_today
              </span>
              <span>
                {timeframe === '7d'
                  ? 'Last 7 Days'
                  : timeframe === '24h'
                  ? 'Last 24 Hours'
                  : 'Last 30 Days'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-text-muted">
                arrow_drop_down
              </span>
            </button>

            {timeDropdownOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-surface-canvas border border-border-strong rounded-xl shadow-lg z-30 p-1 flex flex-col gap-0.5">
                {[
                  { id: '24h', label: 'Last 24 Hours' },
                  { id: '7d', label: 'Last 7 Days' },
                  { id: '30d', label: 'Last 30 Days' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => {
                      setTimeframe(tf.id as any);
                      setTimeDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 text-left font-label-md rounded-lg text-body-sm transition-colors ${
                      timeframe === tf.id
                        ? 'bg-primary-container text-on-primary font-medium'
                        : 'hover:bg-surface-subtle text-text-primary'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Environment Tag */}
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-container text-on-surface-variant font-label-md text-label-md">
            <span className="w-2 h-2 rounded-full bg-status-success"></span>
            <span className="font-code-sm text-code-sm font-medium">{selectedEnv}</span>
          </div>
        </div>
      </div>

      {/* Runs Table with Integrated Expandable Inspector */}
      <div className="bg-surface-canvas rounded-xl shadow-sm border border-border-subtle/50 overflow-hidden flex flex-col">
        {/* Desktop Table Header */}
        <div className="hidden lg:grid grid-cols-12 px-space-md py-space-sm bg-surface-subtle text-text-muted font-label-sm text-label-sm uppercase tracking-wider items-center border-b border-border-subtle">
          <div className="col-span-4">Test Name</div>
          <div className="col-span-2">Suite / Branch</div>
          <div className="col-span-1">Run Time</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-text-muted">search_off</span>
            <p className="font-label-md text-text-primary">No test runs found matching filters</p>
            <p className="font-body-sm text-text-muted">
              Try adjusting your search query or status filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredRuns.map((run) => {
            const isExpanded = !!expandedRows[run.id];
            const isTechOpen = !!expandedTechDetails[run.id];

            return (
              <div
                key={run.id}
                className="flex flex-col border-b border-border-subtle last:border-b-0"
              >
                {/* Main Row Bar */}
                <div
                  className={`p-space-md lg:px-space-md lg:py-space-sm grid grid-cols-1 lg:grid-cols-12 gap-space-sm lg:gap-0 items-start lg:items-center transition-colors ${
                    isExpanded ? 'bg-surface-container-low' : 'hover:bg-surface-subtle'
                  }`}
                >
                  {/* Test Name Column */}
                  <div className="col-span-4 flex items-start gap-space-sm min-w-0">
                    <button
                      aria-label="Toggle details"
                      onClick={() => toggleRow(run.id)}
                      className="text-text-secondary hover:text-text-primary p-0.5 rounded transition-transform mt-0.5 cursor-pointer"
                      type="button"
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      >
                        chevron_right
                      </span>
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className="font-code-md text-code-md text-text-primary font-medium truncate">
                        {run.specFile}
                      </span>
                      <span className="font-body-sm text-body-sm text-text-secondary truncate">
                        {run.description}
                      </span>
                    </div>
                  </div>

                  {/* Suite / Branch Column */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-text-muted">
                      alt_route
                    </span>
                    <span className="font-code-sm text-code-sm text-text-secondary px-1.5 py-0.5 rounded bg-surface-container truncate">
                      {run.branch}
                    </span>
                  </div>

                  {/* Run Time Column */}
                  <div className="col-span-1 font-body-sm text-body-sm text-text-secondary">
                    {run.timeAgo}
                  </div>

                  {/* Duration Column */}
                  <div className="col-span-1 font-code-sm text-code-sm text-text-secondary">
                    {run.duration}
                  </div>

                  {/* Status Column */}
                  <div className="col-span-2 flex flex-col gap-0.5">
                    {run.status === 'healed_passed' && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-warning-subtle text-status-warning font-label-sm text-label-sm font-semibold w-max border border-status-warning/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                          Healed & Passed
                        </span>
                        <span className="font-code-sm text-code-sm text-status-healed">
                          {run.statusSubtitle}
                        </span>
                      </>
                    )}

                    {run.status === 'passed' && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-success-subtle text-status-success font-label-sm text-label-sm font-semibold w-max border border-status-success/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                          Passed
                        </span>
                        <span className="font-code-sm text-code-sm text-text-muted">
                          {run.statusSubtitle}
                        </span>
                      </>
                    )}

                    {run.status === 'failed' && (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-status-failure-subtle text-status-failure font-label-sm text-label-sm font-semibold w-max border border-status-failure/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-failure"></span>
                          Failed
                        </span>
                        <span className="font-code-sm text-code-sm text-status-failure truncate">
                          {run.statusSubtitle}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="col-span-2 flex items-center justify-end gap-space-xs">
                    {run.status === 'failed' ? (
                      <button
                        onClick={() => onInvestigate(run)}
                        className="inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-status-failure-subtle text-status-failure font-label-md text-label-md hover:bg-status-failure hover:text-white transition-all font-semibold cursor-pointer border border-status-failure/30"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                        <span>Investigate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleRow(run.id)}
                        className="inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-canvas shadow-sm text-text-primary font-label-md text-label-md hover:bg-surface-subtle transition-colors cursor-pointer border border-border-subtle"
                        type="button"
                      >
                        <span>{isExpanded ? 'Collapse' : 'View Details'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Inspection Panel */}
                {isExpanded && (
                  <div className="p-space-lg bg-surface-subtle flex flex-col gap-space-lg border-t border-border-subtle">
                    {/* Healed Banner (if healed) */}
                    {run.status === 'healed_passed' && (
                      <div className="bg-status-healed-subtle rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-status-healed/30">
                        <div className="flex items-center gap-space-sm">
                          <div className="p-2 rounded-lg bg-status-healed text-on-primary flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                              Test Passed via Self-Healing ({run.healedCount || 1} issue resolved)
                            </span>
                            <span className="font-body-sm text-body-sm text-text-secondary">
                              Synthetic selector mutation applied dynamically during Playwright execution without halting assertion tree.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-xs self-stretch sm:self-auto justify-end flex-wrap">
                          <button
                            onClick={() => onRerunTest(run.id)}
                            className="inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-canvas text-text-primary shadow-sm hover:bg-surface-subtle font-label-md text-label-md transition-colors cursor-pointer border border-border-subtle"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">replay</span>
                            <span>Rerun Test</span>
                          </button>
                          <button
                            onClick={() => onViewInHealingQueue(run.specFile)}
                            className="inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-status-healed text-on-primary shadow-sm hover:opacity-90 font-label-md text-label-md transition-colors cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            <span>View in Healing Queue</span>
                          </button>
                          <button
                            onClick={() => onOpenTrace(run)}
                            className="inline-flex items-center gap-1 px-space-sm py-1 rounded-lg bg-surface-canvas text-text-primary shadow-sm hover:bg-surface-subtle font-label-md text-label-md transition-colors cursor-pointer border border-border-subtle"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">file_download</span>
                            <span>Trace</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Failed Banner (if failed) */}
                    {run.status === 'failed' && (
                      <div className="bg-status-failure-subtle rounded-xl p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-status-failure/30">
                        <div className="flex items-center gap-space-sm">
                          <div className="p-2 rounded-lg bg-status-failure text-on-primary flex items-center justify-center shadow-xs">
                            <span className="material-symbols-outlined text-[20px]">error</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                              Test Assertion Halted (Threshold Protection)
                            </span>
                            <span className="font-body-sm text-body-sm text-text-secondary">
                              GhostRunner discovered a potential candidate with 64% similarity, but aborted automated execution because threshold is set to 70%.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-space-xs">
                          <button
                            onClick={() => onInvestigate(run)}
                            className="inline-flex items-center gap-1 px-space-md py-1.5 rounded-lg bg-status-failure text-on-primary font-label-md font-semibold hover:opacity-90 transition-all cursor-pointer shadow-sm"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
                            <span>Investigate & Resolve</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Execution Step Timeline */}
                    <div className="bg-surface-canvas rounded-xl p-space-lg shadow-sm border border-border-subtle/50 flex flex-col gap-space-md">
                      <div className="flex items-center justify-between pb-space-sm border-b border-border-subtle/40">
                        <div className="flex items-center gap-space-xs">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            account_tree
                          </span>
                          <span className="font-headline-sm text-headline-sm text-text-primary font-semibold">
                            Execution Step Timeline
                          </span>
                        </div>
                        <span className="font-code-sm text-code-sm text-text-muted">
                          {run.traceInfo?.browser || 'Playwright Chromium Headless'} • {run.traceInfo?.viewport || '1080p'}
                        </span>
                      </div>

                      {/* Steps list */}
                      <div className="flex flex-col gap-space-md relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container">
                        {run.steps.map((step) => {
                          const isHealed = step.status === 'healed';
                          const isFailed = step.status === 'failed';

                          return (
                            <div key={step.stepNumber} className="flex items-start gap-space-md relative">
                              {/* Icon indicator */}
                              {isHealed ? (
                                <span className="w-7 h-7 rounded-full bg-status-warning-subtle text-status-warning flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-surface-canvas border border-status-warning/40 shadow-xs">
                                  <span className="material-symbols-outlined text-[16px]">
                                    auto_fix_high
                                  </span>
                                </span>
                              ) : isFailed ? (
                                <span className="w-7 h-7 rounded-full bg-status-failure-subtle text-status-failure flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-surface-canvas border border-status-failure/40 shadow-xs">
                                  <span className="material-symbols-outlined text-[16px]">close</span>
                                </span>
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-status-success-subtle text-status-success flex items-center justify-center flex-shrink-0 z-10 border border-status-success/30">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </span>
                              )}

                              {/* Step Body */}
                              {isHealed ? (
                                <div className="flex-1 flex flex-col gap-space-sm bg-surface-subtle p-space-md rounded-xl border border-border-subtle">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="flex items-center gap-space-xs flex-wrap">
                                      <span className="font-label-md text-label-md text-text-primary font-semibold">
                                        Step {step.stepNumber}: {step.title}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-status-warning bg-status-warning-subtle font-code-sm text-code-sm font-semibold border border-status-warning/30">
                                        FAILED ➔ HEALED
                                      </span>
                                    </div>
                                    <span className="font-code-sm text-code-sm text-status-healed font-medium">
                                      Intervention: {step.interventionMs || 32}ms
                                    </span>
                                  </div>

                                  {/* Diff Inspector Panel */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-1">
                                    {/* Broken Original */}
                                    <div className="p-space-sm rounded-lg bg-status-failure-subtle flex flex-col gap-1 border border-status-failure/20">
                                      <span className="font-label-sm text-label-sm text-status-failure font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">
                                          close
                                        </span>
                                        Broken Original Locator
                                      </span>
                                      <code className="font-code-sm text-code-sm text-status-failure bg-surface-canvas p-1 rounded font-semibold break-all border border-status-failure/20">
                                        {step.brokenLocator || 'button#checkout-submit'}
                                      </code>
                                      <span className="font-body-sm text-body-sm text-text-secondary mt-1">
                                        {step.errorMessage ||
                                          'TimeoutError: element not visible or detached from DOM after 3000ms'}
                                      </span>
                                    </div>

                                    {/* Healed Selector */}
                                    <div className="p-space-sm rounded-lg bg-status-healed-subtle flex flex-col gap-1 border border-status-healed/20">
                                      <span className="font-label-sm text-label-sm text-status-healed font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">
                                          auto_fix_high
                                        </span>
                                        Healed Selector ({step.matchScore || 94}% match)
                                      </span>
                                      <code className="font-code-sm text-code-sm text-status-healed bg-surface-canvas p-1 rounded font-semibold break-all border border-status-healed/20">
                                        {step.healedLocator || 'button[data-testid="place-order-cta"]'}
                                      </code>
                                      <span className="font-body-sm text-body-sm text-text-secondary mt-1">
                                        {step.matchReason ||
                                          'GhostRunner neural matching recovered target based on accessibility tree and sibling text.'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : isFailed ? (
                                <div className="flex-1 flex flex-col gap-space-sm bg-status-failure-subtle/30 p-space-md rounded-xl border border-status-failure/30">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="flex items-center gap-space-xs">
                                      <span className="font-label-md text-label-md text-text-primary font-semibold">
                                        Step {step.stepNumber}: {step.title}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded text-status-failure bg-status-failure-subtle font-code-sm text-code-sm font-semibold border border-status-failure/30">
                                        FAILED
                                      </span>
                                    </div>
                                    <span className="font-code-sm text-code-sm text-status-failure">
                                      Timed out • 3000ms
                                    </span>
                                  </div>
                                  <div className="p-space-sm rounded-lg bg-surface-canvas border border-status-failure/30 flex flex-col gap-1">
                                    <code className="font-code-sm text-code-sm text-status-failure">
                                      {step.brokenLocator}
                                    </code>
                                    <span className="font-body-sm text-body-sm text-text-secondary">
                                      {step.errorMessage}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-0.5">
                                  <div className="flex items-center gap-space-sm flex-wrap">
                                    <span className="font-label-md text-label-md text-text-primary font-medium">
                                      Step {step.stepNumber}: {step.title}
                                    </span>
                                    {step.target && (
                                      <span className="font-code-sm text-code-sm bg-surface-subtle px-1.5 py-0.5 rounded text-text-secondary border border-border-subtle">
                                        {step.target}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-code-sm text-code-sm text-text-muted">
                                    Passed • {step.durationMs}ms
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Collapsible technical details */}
                      <div className="mt-space-sm pt-space-md border-t-0 bg-surface-subtle rounded-xl p-space-sm border border-border-subtle/50">
                        <button
                          onClick={() => toggleTech(run.id)}
                          className="w-full flex items-center justify-between text-left p-space-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          type="button"
                        >
                          <div className="flex items-center gap-space-xs font-label-md text-label-md font-medium">
                            <span
                              className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                                isTechOpen ? 'rotate-90' : ''
                              }`}
                            >
                              chevron_right
                            </span>
                            <span>
                              View technical details (Raw Playwright Trace, Console Logs, XPath Fallbacks)
                            </span>
                          </div>
                          <span className="font-code-sm text-code-sm text-text-muted">
                            JSON / Har format
                          </span>
                        </button>

                        {isTechOpen && (
                          <div className="flex flex-col gap-space-sm p-space-sm mt-space-xs font-code-sm text-code-sm">
                            <div className="bg-surface-canvas rounded-lg p-space-sm text-text-secondary flex flex-col gap-1 border border-border-subtle">
                              <div className="flex items-center justify-between pb-1 border-b border-border-subtle">
                                <span className="font-bold text-text-primary">Console Log Stream:</span>
                                <span className="text-text-muted text-[10px]">
                                  Trace HAR: {run.traceInfo?.harSize || '4.2 MB'} • {run.traceInfo?.domSnapshots || 14} snapshots
                                </span>
                              </div>
                              <div className="text-text-muted leading-relaxed font-mono space-y-1 mt-1 max-h-48 overflow-y-auto">
                                {run.consoleLogs && run.consoleLogs.length > 0 ? (
                                  run.consoleLogs.map((log, lIdx) => (
                                    <div
                                      key={lIdx}
                                      className={
                                        log.includes('[ghostrunner]')
                                          ? 'text-status-healed bg-status-healed-subtle/40 px-1 rounded'
                                          : log.includes('[warn]')
                                          ? 'text-status-warning'
                                          : log.includes('[error]')
                                          ? 'text-status-failure'
                                          : ''
                                      }
                                    >
                                      {log}
                                    </div>
                                  ))
                                ) : (
                                  <div>[info] No additional console logs generated.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination & Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm px-space-sm text-text-secondary font-label-sm text-label-sm">
        <div className="flex items-center gap-2">
          <span>Showing 4 of 128 automated test runs</span>
          <span className="text-text-muted">•</span>
          <span className="font-code-sm text-code-sm text-text-muted">
            Commit ac38f12 (Merge pull request #402)
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            className="p-1 rounded bg-surface-canvas opacity-40 cursor-not-allowed border border-border-subtle"
            disabled
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            className="px-2.5 py-1 rounded bg-primary-container text-on-primary font-semibold shadow-xs"
            type="button"
          >
            1
          </button>
          <button
            className="px-2.5 py-1 rounded bg-surface-canvas text-text-secondary hover:bg-surface-subtle border border-border-subtle cursor-pointer"
            type="button"
          >
            2
          </button>
          <button
            className="px-2.5 py-1 rounded bg-surface-canvas text-text-secondary hover:bg-surface-subtle border border-border-subtle cursor-pointer"
            type="button"
          >
            3
          </button>
          <span className="px-1 text-text-muted">...</span>
          <button
            className="px-2.5 py-1 rounded bg-surface-canvas text-text-secondary hover:bg-surface-subtle border border-border-subtle cursor-pointer"
            type="button"
          >
            16
          </button>
          <button
            className="p-1 rounded bg-surface-canvas text-text-secondary hover:bg-surface-subtle border border-border-subtle cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
