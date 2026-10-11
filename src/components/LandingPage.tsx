import React, { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onLaunchConsole: (initialTab?: 'dashboard' | 'projects' | 'test-runs' | 'healing-queue' | 'settings') => void;
  onRunSampleSuite?: () => void;
  onRunDemoSuite?: () => void;
  onNavigateToAuth?: (page: 'signin' | 'signup' | 'forgot-password') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchConsole,
  onRunSampleSuite,
  onRunDemoSuite,
  onNavigateToAuth,
}) => {
  const handleRunSuite = onRunSampleSuite || onRunDemoSuite || (() => {});
  const [codeTab, setCodeTab] = useState<'ts' | 'python' | 'github'>('ts');
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [inspectorInterventionActive, setInspectorInterventionActive] = useState(true);
  const [inspectorInterventionCount, setInspectorInterventionCount] = useState(1);

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('npm install @ghostrunner/agent');
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex flex-col selection:bg-primary-container selection:text-white">
      {/* 1. Global Public Top Navigation */}
      <header className="sticky top-0 z-50 bg-surface-canvas/90 backdrop-blur-md border-b border-border-subtle h-16 flex items-center px-4 sm:px-8 lg:px-12 justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onLaunchConsole('test-runs')}
          >
            <img
              alt="GhostRunner Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWipWggVeqSAcbSqiwXIe3oGk4VZEyU7NwyTuoqToHWKaTPoZ5RJABX3rk5CE7aD5cii7FeWroTg92xPIpxEmgW0HTJKs93o1w58hcwVv45oH45FXawQLOCJt3TnanUx5U3V2CxIHvCqH27gd9AyAS9zsa_kL__LEDAaXRyW2BKSoYtqyJzIIu9KmTw2ZkYsHWNEXaBsqwsh9AUnUd5X0gfZDhwkbAVQZSDiMsREPg0S1bQAogwtOllsm7ZVzjOj7tfg"
            />
            <span className="font-headline-sm text-text-primary tracking-tight font-bold text-lg">
              GhostRunner
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a
              href="#engine"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Self-Healing Engine
            </a>
            <a
              href="#features"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Visual Flow Studio
            </a>
            <a
              href="#features"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              CI/CD Cloud
            </a>
            <a
              href="#developer"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Integrations
            </a>
            <button
              onClick={() => onLaunchConsole('test-runs')}
              className="hover:text-text-primary transition-colors whitespace-nowrap cursor-pointer text-left"
            >
              Docs
            </button>
            <a
              href="#comparison"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Pricing
            </a>
            <a
              href="#comparison"
              className="hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Enterprise
            </a>
          </nav>
        </div>

        {/* Right CTA zone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Theme Toggle */}
          <ThemeToggle variant="icon" className="h-9 w-9" />

          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('signin') : onLaunchConsole('test-runs'))}
            className="h-9 px-3.5 inline-flex items-center justify-center text-sm font-medium text-text-primary hover:text-primary hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('signup') : onLaunchConsole('projects'))}
            className="h-9 px-4 inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Start Free Trial</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Main Hero Headline with distinctive curved underline */}
        <h1 className="font-display-hero text-3xl sm:text-5xl lg:text-6xl text-text-primary font-bold tracking-tight max-w-4xl leading-tight">
          Never fix a broken test locator{' '}
          <span className="relative inline-block text-primary">
            again.
            <svg
              className="absolute -bottom-2 left-0 w-full overflow-visible"
              height="8"
              viewBox="0 0 100 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 5.5C18 2.5 35 7.5 50 4.5C65 1.5 82 6.5 99 3.5"
                stroke="#2563EB"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg lg:text-xl text-text-secondary max-w-3xl leading-relaxed">
          AI agents that keep end-to-end tests passing when UI changes. GhostRunner synthesizes
          resilient DOM locators on the fly, intercepts flaky timeouts, and stages verified GitHub
          PRs automatically.
        </p>

        {/* CTAs Row */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => (onNavigateToAuth ? onNavigateToAuth('signup') : onLaunchConsole('projects'))}
            className="h-12 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Start Free Trial</span>
          </button>

          <button
            type="button"
            onClick={handleRunSuite}
            className="h-12 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-surface-canvas text-text-primary border border-border-strong font-semibold text-sm hover:bg-surface-subtle transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">play_circle</span>
            <span>Run Sample Suite</span>
          </button>

          {/* Copyable NPM command snippet - styled distinctly as a code block utility */}
          <div className="h-12 flex items-center gap-2 px-4 rounded-xl bg-surface-subtle/80 border border-dashed border-border-strong font-mono text-xs text-text-secondary select-all shadow-2xs">
            <span className="text-primary font-bold select-none">$</span>
            <span className="text-text-primary font-medium tracking-tight">npm install @ghostrunner/agent</span>
            <button
              type="button"
              onClick={handleCopyInstall}
              title="Copy to clipboard"
              aria-label="Copy to clipboard"
              className="ml-1 p-1.5 rounded-md hover:bg-surface-container text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedInstall ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Social Proof Logostrip */}
        <div className="mt-16 flex flex-col items-center gap-4 w-full">
          <span className="font-label-sm text-xs text-text-muted font-semibold tracking-normal">
            Trusted by testing teams at high-velocity organizations
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all text-text-primary font-bold text-sm tracking-tight">
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-text-primary"></span>
              Linear
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-text-primary"></span>
              Vercel
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              Supabase
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="w-2.5 h-2.5 rounded-sm bg-text-primary"></span>
              Retool
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">pets</span>
              Datadog
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <span className="font-mono text-base font-black">///</span>
              Stripe
            </span>
          </div>
        </div>
      </section>

      {/* 3. Live Telemetry Inspector Showcase */}
      <section id="engine" className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-4">
          {/* Section Header with live badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-ping"></span>
              <span className="font-label-sm text-xs uppercase tracking-wider font-bold text-status-success">
                LIVE RUNNER TELEMETRY
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-full bg-status-healed-subtle text-status-healed border border-status-healed/30 font-semibold flex items-center gap-1 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-status-healed"></span>
                99.4% Healing Rate
              </span>
              <span className="px-2.5 py-1 rounded-full bg-surface-muted text-text-secondary border border-border-subtle text-xs font-medium">
                3m 36s avg run duration
              </span>
              <span className="px-2.5 py-1 rounded-full bg-status-success-subtle text-status-success border border-status-success/30 font-medium text-xs">
                0 Flaky Failures
              </span>
            </div>
          </div>

          <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-text-primary">
            The Self-Healing Engine in Real-Time
          </h2>

          {/* Interactive Inspector Terminal / Container */}
          <div className="bg-surface-canvas rounded-2xl border border-border-strong shadow-lg overflow-hidden flex flex-col">
            {/* Top Bar */}
            <div className="bg-surface-subtle px-4 py-2.5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-code-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <span className="font-medium text-text-primary">
                  e2e/checkout-flows.spec.ts — Playwright WebKit 18.2
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-status-healed-subtle text-status-healed border border-status-healed/30 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  AGENT HEAL ACTIVE
                </span>
                <span className="text-text-muted">Thread #4 • Cloud US-East</span>
              </div>
            </div>

            {/* Guided Process Stepper Bar to clarify the 3-step healing story */}
            <div className="bg-surface-subtle/80 px-4 py-2.5 border-b border-border-subtle flex items-center justify-between text-xs font-medium text-text-secondary overflow-x-auto">
              <div className="flex items-center gap-2 sm:gap-6 min-w-max">
                <span className="flex items-center gap-1.5 text-text-primary font-semibold">
                  <span className="w-5 h-5 rounded-full bg-status-failure/15 text-status-failure text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>Intercept DOM Mutation</span>
                </span>
                <span className="text-border-strong select-none">→</span>
                <span className="flex items-center gap-1.5 text-text-primary font-semibold">
                  <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>Neural Graph Resolver</span>
                </span>
                <span className="text-border-strong select-none">→</span>
                <span className="flex items-center gap-1.5 text-text-primary font-semibold">
                  <span className="w-5 h-5 rounded-full bg-status-healed/15 text-status-healed text-[11px] font-bold flex items-center justify-center">3</span>
                  <span>Auto-Stage Verified PR</span>
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] text-text-muted font-mono">Real-Time Event Stream</span>
            </div>

            {/* 3-Column Execution Stage Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle bg-surface-canvas">
              {/* Column 1: Playwright Test Step */}
              <div className="p-4 sm:p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-xs text-text-muted uppercase tracking-wider font-semibold">
                      1. PLAYWRIGHT TEST STEP
                    </span>
                    <span className="font-code-sm text-[11px] px-1.5 py-0.5 rounded bg-status-failure-subtle text-status-failure font-bold">
                      DOM Missing
                    </span>
                  </div>

                  <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle font-mono text-xs leading-relaxed">
                    <div className="text-text-muted">// Step 14: Final Cart Checkout</div>
                    <div className="text-text-primary font-medium">await page.goto('/cart/checkout');</div>
                    <div className="text-status-failure font-bold bg-status-failure-subtle/50 px-1 py-0.5 rounded mt-1">
                      await page.click('button#checkout-submit');
                    </div>
                    <div className="text-xs text-status-failure mt-1.5 font-medium">
                      ElementHandle Error: Timeout 5000ms exceeded locating button#checkout-submit
                    </div>
                  </div>
                </div>

                {/* Column 1 Standardized Footer Box */}
                <div className="h-[52px] flex items-center gap-2 text-xs text-text-secondary bg-surface-subtle/60 p-2.5 rounded-xl border border-border-subtle">
                  <span className="material-symbols-outlined text-[18px] text-status-warning shrink-0">
                    auto_fix_normal
                  </span>
                  <span className="truncate">Root cause: Button ID replaced by randomized hash</span>
                </div>
              </div>

              {/* Column 2: Neural Resolver */}
              <div className="p-4 sm:p-5 flex flex-col justify-between gap-4 bg-surface-subtle/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-xs text-text-muted uppercase tracking-wider font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                      2. NEURAL RESOLVER
                    </span>
                    <span className="font-code-sm text-xs text-text-muted">Latency: 32ms</span>
                  </div>

                  {/* Confidence Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Visual Geometry Match</span>
                      <span className="font-mono font-bold text-status-healed">99.1%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-status-healed h-full w-[99.1%]"></div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-text-secondary">ARIA Tree & Semantic Role</span>
                      <span className="font-mono font-bold text-status-healed">98.6%</span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                      <div className="bg-status-healed h-full w-[98.6%]"></div>
                    </div>
                  </div>

                  <div className="bg-status-healed-subtle/60 p-2.5 rounded-lg border border-status-healed/30 text-xs">
                    <span className="text-text-secondary text-xs block font-medium">Synthesized candidate:</span>
                    <code className="font-mono text-status-healed font-bold">
                      button[data-testid='place-order-cta']
                    </code>
                  </div>
                </div>

                {/* Column 2 Standardized Footer Box */}
                <div className="h-[52px] flex items-center justify-between text-xs text-text-secondary bg-surface-subtle/60 p-2.5 rounded-xl border border-border-subtle px-3">
                  <span className="flex items-center gap-1.5 text-status-healed font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-healed"></span>
                    Heuristic Consensus
                  </span>
                  <span className="text-text-muted text-xs">Threshold: &gt;0.85</span>
                </div>
              </div>

              {/* Column 3: Patch Applied & Staged */}
              <div className="p-4 sm:p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-code-sm text-xs text-text-muted uppercase tracking-wider font-semibold">
                      3. PATCH APPLIED & STAGED
                    </span>
                    <span className="font-code-sm text-[11px] px-1.5 py-0.5 rounded bg-status-success-subtle text-status-success font-bold">
                      PASSED
                    </span>
                  </div>

                  {/* Diff */}
                  <div className="bg-surface-subtle p-3 rounded-xl border border-border-subtle font-mono text-xs leading-relaxed space-y-1">
                    <div className="text-status-failure line-through bg-status-failure-subtle/40 px-1 rounded">
                      - await page.click('button#checkout-submit');
                    </div>
                    <div className="text-status-healed font-bold bg-status-healed-subtle/60 px-1 rounded">
                      + await page.click('button[data-testid="pla...');
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-subtle mt-2">
                      <span>Execution Time: +32ms</span>
                      <span className="text-status-success font-semibold">Zero test interruption</span>
                    </div>
                  </div>
                </div>

                {/* Column 3 Standardized Footer Box with Prominent Filled Review PR Button and Breathing Room */}
                <div className="h-[52px] bg-surface-subtle/60 p-2.5 rounded-xl border border-border-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 mr-1">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">merge</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-md text-xs font-bold text-text-primary truncate">
                        PR #1042 ready to merge
                      </span>
                      <span className="text-xs text-text-secondary truncate" title="ghostrunner[bot] pushed 1 locator commit">
                        ghostrunner[bot] · 1 commit
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLaunchConsole('healing-queue')}
                    className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                  >
                    <span>Review PR</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Bento Grid Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto mb-12">
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-primary px-3 py-1 rounded-full bg-primary-container/10 border border-primary/20">
            AGENTIC AI RESILIENCE
          </span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Engineered for QA speed. Built without vendor lock-in.
          </h2>
          <p className="font-body-md text-base text-text-secondary">
            Everything you love about modern open-source Playwright and Cypress combined with the
            enterprise power of autonomous self-healing locators.
          </p>
        </div>

        {/* Feature Grid: Standardized 3-column layout with equal height cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Autonomous Self-Healing Locators */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">visibility</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-primary">
                Vision + DOM Semantic Graph
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Autonomous Self-Healing Locators
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                When CSS classnames change, IDs mutate, or components get wrapped in shadow roots,
                GhostRunner parses the accessibility tree and visual bounding box to pinpoint the target in milliseconds.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <span className="text-xs text-status-healed font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-healed"></span>
                99.8% Recovery Precision
              </span>
              <button
                type="button"
                onClick={() => onLaunchConsole('healing-queue')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>Explore Locator Healing</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 2: Drop-In SDK */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-healed-subtle text-status-healed flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">terminal</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-status-healed">
                Zero Migration Friction
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Drop-In SDK for Playwright & Cypress
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                Keep your existing TypeScript or Python test suites. GhostRunner wraps your browser
                harness via a simple 3-line wrapper without changing assertion syntax.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <div className="bg-surface-subtle p-2.5 rounded-xl border border-border-subtle font-mono text-[11px] text-text-primary">
                <span className="text-primary font-semibold">import {'{ withGhostRunner }'}</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchConsole('test-runs')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>View SDK Integration Guide</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 3: Visual Flow Studio */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">videocam</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-primary">
                Time-Travel Debugging
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Visual Flow Studio & HAR Traces
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                Step backwards and forwards through real video replays, network waterfalls, DOM
                mutations, and agent reasoning logs for every executed action.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                Step-by-step trace inspection
              </span>
              <button
                type="button"
                onClick={() => onLaunchConsole('test-runs')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>Explore Visual Timeline</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 4: Automatic GitHub PRs */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-healed-subtle text-status-healed flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">auto_mode</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-status-healed">
                Git-Native Workflow
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Automatic GitHub & GitLab PRs
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                GhostRunner doesn't just hotfix tests during runtime. It bundles confirmed locator
                changes into cleanly structured git commits ready for 1-click team review.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs text-status-healed font-medium">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Auto-stages verified branch PR</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchConsole('healing-queue')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>Learn About Git Workflows</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 5: Parallel Cloud Execution Matrix */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-muted text-text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">lan</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-text-secondary">
                Distributed Infrastructure
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Parallel Cloud Execution Matrix
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                Spin up 100+ isolated headless Chromium, Firefox, and WebKit runners across global
                zones with instant test sharding and automatic timeout intercepts.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Multi-Region Cloud</span>
                <span className="font-bold text-status-success">99.99% SLA</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchConsole('dashboard')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>View Cloud Infrastructure</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Card 6: Flakiness Scoring & Quarantine */}
          <div className="bg-surface-canvas rounded-2xl p-6 border border-border-subtle shadow-sm flex flex-col justify-between hover:border-border-strong transition-all h-full">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">query_stats</span>
              </div>
              <span className="font-code-sm text-xs font-semibold text-primary">
                Predictive Quality
              </span>
              <h3 className="font-headline-md text-lg font-bold text-text-primary">
                Flakiness Scoring & Quarantine
              </h3>
              <p className="font-body-md text-text-secondary text-sm leading-relaxed">
                Continuously monitor suite reliability metrics, quarantine intermittent assertions before they block pipelines, and prioritize selector refactors.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>Predictive Reliability</span>
                <span className="font-bold text-status-healed">Zero False Positives</span>
              </div>
              <button
                type="button"
                onClick={() => onLaunchConsole('dashboard')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline cursor-pointer text-left"
              >
                <span>Explore Test Health Telemetry</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Architecture Comparison Table Section */}
      <section id="comparison" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto mb-12">
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-primary px-3 py-1 rounded-full bg-primary-container/10 border border-primary/20">
            ARCHITECTURE COMPARISON
          </span>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
            Why engineering leaders replace flaky test suites with GhostRunner
          </h2>
          <p className="font-body-md text-base text-text-secondary">
            Traditional scripts break when the DOM changes. Legacy enterprise RPA locks you into
            proprietary UI editors. GhostRunner gives you the best of both worlds.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-surface-canvas rounded-2xl border border-border-subtle shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="border-b border-border-subtle text-xs font-code-sm uppercase tracking-wider text-text-secondary bg-surface-subtle">
                <th className="p-4 sm:px-5 sm:py-4 font-semibold w-[28%]">EVALUATION VECTOR</th>
                <th className="p-4 sm:px-5 sm:py-4 font-bold text-primary bg-primary-container/5 border-x border-primary/20 w-[28%]">
                  GHOSTRUNNER AI
                </th>
                <th className="p-4 sm:px-5 sm:py-4 font-semibold text-text-secondary w-[22%]">STANDARD PLAYWRIGHT / SELENIUM</th>
                <th className="p-4 sm:px-5 sm:py-4 font-semibold text-text-secondary w-[22%]">LEGACY RPA / KATALON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              <tr>
                <td className="p-4 sm:px-5 sm:py-4 font-medium text-text-primary">
                  Dynamic UI & Locator Adaptation
                </td>
                <td className="p-4 sm:px-5 sm:py-4 bg-primary-container/5 border-x border-primary/20 font-semibold text-status-healed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-status-healed">verified</span>
                  <span>Autonomous AI Vision + ARIA semantic resolution</span>
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-failure">
                  ✕ Fails immediately on selector mutations
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-warning">
                  ▲ Rule-based fallback, high false positive rate
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-5 sm:py-4 font-medium text-text-primary">
                  Setup & Developer Integration
                </td>
                <td className="p-4 sm:px-5 sm:py-4 bg-primary-container/5 border-x border-primary/20 font-semibold text-status-healed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-status-healed">timer</span>
                  <span>&lt;2 minutes (3 lines wrapper config)</span>
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-text-secondary">
                  ▲ Native code (Requires manual scaffold)
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-failure">
                  ✕ Heavy standalone desktop client install
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-5 sm:py-4 font-medium text-text-primary">
                  Test Flakiness & False Alarms
                </td>
                <td className="p-4 sm:px-5 sm:py-4 bg-primary-container/5 border-x border-primary/20 font-semibold text-status-healed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-status-healed">verified_user</span>
                  <span>0% locator flakiness</span>
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-failure">
                  ✕ 30-40% weekly pipeline breakage
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-warning">
                  ▲ 15-20% flakiness from heavy sync loops
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-5 sm:py-4 font-medium text-text-primary">
                  Maintenance & Engineering Overhead
                </td>
                <td className="p-4 sm:px-5 sm:py-4 bg-primary-container/5 border-x border-primary/20 font-semibold text-status-healed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-status-healed">merge</span>
                  <span>Automated GitHub PR staging</span>
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-failure">
                  ✕ Hours spent daily triaging red CI builds
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-text-secondary">
                  ▲ Proprietary repository updates required
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-5 sm:py-4 font-medium text-text-primary">
                  Vendor Lock-In
                </td>
                <td className="p-4 sm:px-5 sm:py-4 bg-primary-container/5 border-x border-primary/20 font-semibold text-status-healed flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-status-healed">lock_open</span>
                  <span>Zero (Native code runs without agent if needed)</span>
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-success font-medium">
                  ✓ Zero (Pure open-source code)
                </td>
                <td className="p-4 sm:px-5 sm:py-4 text-status-failure font-medium">
                  ✕ High (Locked into proprietary test suites)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. Developer Experience Section (3 Lines Setup) */}
      <section id="developer" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold text-primary px-3 py-1 rounded-full bg-primary-container/10 border border-primary/20 w-max">
              DEVELOPER EXPERIENCE FIRST
            </span>
            <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Wraps your existing tests in 3 lines. Zero rewrite.
            </h2>
            <p className="font-body-md text-text-secondary text-base leading-relaxed">
              You don't need to learn a new DSL, adopt a clunky no-code recorder, or rewrite existing
              test suites. Simply configure GhostRunner in your playwright config or CI pipeline.
            </p>

            <div className="space-y-3 mt-2">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-status-success text-[20px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <span className="font-bold text-text-primary block text-sm">
                    Non-invasive Proxy Interception
                  </span>
                  <span className="text-text-secondary text-xs">
                    Monitors DOM interaction calls transparently without changing assertion signatures.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-status-success text-[20px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <span className="font-bold text-text-primary block text-sm">
                    Configurable Confidence Threshold
                  </span>
                  <span className="text-text-secondary text-xs">
                    Define exact heuristic confidence cutoffs (e.g., 0.85) before automated patches are staged.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-status-success text-[20px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <span className="font-bold text-text-primary block text-sm">
                    Git-Native Workflow
                  </span>
                  <span className="text-text-secondary text-xs">
                    Review staged PR diffs in GitHub or GitLab using standard pull request reviews.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Code Window */}
          <div className="lg:col-span-7 bg-[#0b1329] text-white rounded-2xl shadow-xl border border-slate-800 overflow-hidden font-mono text-xs flex flex-col">
            {/* Window bar with balanced padding and unified segmented toggle bar */}
            <div className="bg-[#101b38] px-4 py-3 border-b border-slate-800 flex items-center justify-between text-text-secondary">
              <div
                className="inline-flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 gap-1"
                role="tablist"
                aria-label="Code snippet language selection"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={codeTab === 'ts'}
                  onClick={() => setCodeTab('ts')}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center justify-center ${
                    codeTab === 'ts'
                      ? 'bg-[#1b2b52] text-white font-semibold shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={codeTab === 'python'}
                  onClick={() => setCodeTab('python')}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center justify-center ${
                    codeTab === 'python'
                      ? 'bg-[#1b2b52] text-white font-semibold shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={codeTab === 'github'}
                  onClick={() => setCodeTab('github')}
                  className={`h-8 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer inline-flex items-center justify-center ${
                    codeTab === 'github'
                      ? 'bg-[#1b2b52] text-white font-semibold shadow-xs'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  GitHub Actions CI
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/20 text-primary text-[11px] font-semibold">
                  3-Line Wrapper
                </span>
                <span className="text-xs text-text-secondary font-mono">playwright.config.ts</span>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-4 sm:p-5 overflow-x-auto text-[12px] leading-relaxed">
              {codeTab === 'ts' && (
                <pre>
                  <code>
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/25 mb-2 text-white">
                      <span className="text-primary font-bold">// ✦ The 3 lines that add autonomous self-healing:</span>{'\n'}
                      <span className="text-primary font-semibold">import {'{ withGhostRunner }'} from '@ghostrunner/playwright';</span>{'\n'}
                      <span className="text-white">export default <span className="text-primary font-bold">withGhostRunner</span>(defineConfig({'{'} ... {'}'}));</span>
                    </div>
{`// Full standard Playwright configuration below:
import { defineConfig } from '@playwright/test';

export default withGhostRunner(defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    baseURL: 'https://app.example.com',
    headless: true,
    trace: 'on-first-retry',
  },
  // GhostRunner Autonomous Healing Settings
  ghostrunner: {
    healLocators: true,
    autoStagePR: true,
    confidenceThreshold: 0.85,
    targetBranch: 'main'
  }
}));

// [RUNTIME LOG] Intercepted selector mutation on page.click()
// >> Healed: button#checkout-btn -> button[data-testid="submit-order"] (conf: 0.98)
// >> Staged verified commit to GitHub PR #1042`}
                  </code>
                </pre>
              )}

              {codeTab === 'python' && (
                <pre>
                  <code>
{`# 1. Import GhostRunner pytest fixture
import pytest
from ghostrunner.pytest import ghostrunner_page

# 2. Use as standard Playwright page fixture
def test_checkout_experience(ghostrunner_page):
    ghostrunner_page.goto("https://app.example.com/checkout")
    # Even if IDs change, GhostRunner self-heals
    ghostrunner_page.click("button#legacy-submit-order")
    assert ghostrunner_page.is_visible(".confirmation-banner")`}
                  </code>
                </pre>
              )}

              {codeTab === 'github' && (
                <pre>
                  <code>
{`name: Playwright Tests with GhostRunner
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - name: Run E2E Tests with Autonomous Recovery
        env:
          GHOSTRUNNER_API_KEY: \${{ secrets.GHOSTRUNNER_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: npx playwright test`}
                  </code>
                </pre>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Quantitative Impact Metrics & Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        {/* 3 Metric Stat Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-border-subtle text-center">
          <div className="flex flex-col items-center">
            <span className="font-display-hero text-4xl sm:text-5xl font-extrabold text-primary">
              85%
            </span>
            <span className="font-headline-sm text-sm font-bold text-text-primary mt-2">
              Reduction in QA Maintenance
            </span>
            <span className="text-xs text-text-secondary mt-1">
              Engineers spend less than 15 minutes a week triaging locators.
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-display-hero text-4xl sm:text-5xl font-extrabold text-status-healed">
              10M+
            </span>
            <span className="font-headline-sm text-sm font-bold text-text-primary mt-2">
              Autonomously Healed Test Runs
            </span>
            <span className="text-xs text-text-secondary mt-1">
              Across production deployments in multi-cloud CI pipelines.
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="font-display-hero text-4xl sm:text-5xl font-extrabold text-status-warning">
              4.9 / 5
            </span>
            <span className="font-headline-sm text-sm font-bold text-text-primary mt-2">
              G2 & Product Hunt Leader
            </span>
            <span className="text-xs text-text-secondary mt-1">
              Voted #1 Best Developer Tool For Automated Testing 2025.
            </span>
          </div>
        </div>

        {/* 2 Testimonials Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Testimonial 1 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-canvas border border-border-subtle shadow-sm flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center text-status-warning text-sm" role="img" aria-label="5 out of 5 stars">
                <span aria-hidden="true">★★★★★</span>
              </div>
              <p className="font-body-md text-text-secondary italic leading-relaxed">
                "Our on-call engineering team used to wake up at 2 AM simply because a Tailwind refactor
                broke an un-tested CSS selector in Cypress. GhostRunner healed over 140 flaky tests
                last month without a single false positive."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                AK
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-text-primary text-sm">Alexei Korolev</span>
                <span className="text-xs text-text-muted">VP of Infrastructure & Quality, FinScale</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="p-6 sm:p-8 rounded-2xl bg-surface-canvas border border-border-subtle shadow-sm flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center text-status-warning text-sm" role="img" aria-label="5 out of 5 stars">
                <span aria-hidden="true">★★★★★</span>
              </div>
              <p className="font-body-md text-text-secondary italic leading-relaxed">
                "We evaluated Katalon and Skyvern, but GhostRunner struck the exact right balance:
                true agentic intelligence combined with our standard Playwright code repositories.
                The automatic PR generation feature alone saved us 20 hours a sprint."
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-border-subtle">
              <div className="w-10 h-10 rounded-full bg-status-healed/20 text-status-healed font-bold flex items-center justify-center text-sm">
                SL
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-text-primary text-sm">Sarah Lin</span>
                <span className="text-xs text-text-muted">Lead SDET Architect, CloudFlow</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Banner Card */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl bg-[#1d4ed8] text-white p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-800 via-[#1d4ed8] to-blue-600 opacity-95"></div>

          <div className="relative z-10 flex flex-col items-center max-w-3xl gap-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white border border-white/30 text-xs font-semibold backdrop-blur-xs">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>5-Minute Zero-Risk Implementation</span>
            </div>

            <h2 className="font-display-hero text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to eradicate test flakiness for good?
            </h2>

            <p className="text-white text-sm sm:text-base max-w-2xl mt-1 opacity-95">
              Start testing autonomously in under 5 minutes. No credit card required. Connect your
              GitHub repository and watch your test suite heal itself on the next push.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => (onNavigateToAuth ? onNavigateToAuth('signup') : onLaunchConsole('projects'))}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1d4ed8] font-bold text-sm shadow-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Start Free Trial</span>
              </button>

              <button
                type="button"
                onClick={handleRunSuite}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 border border-white/60 text-white font-semibold text-sm hover:bg-white/20 transition-all cursor-pointer"
              >
                <span>Run Sample Suite</span>
              </button>
            </div>

            {/* Badges footer */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/90 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">shield</span>
                SOC2 Type II Certified
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
                HIPAA Ready
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                GDPR Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                99.99% Cloud SLA
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Comprehensive Public Footer */}
      <footer className="bg-surface-canvas border-t border-border-subtle pt-16 pb-8 px-4 sm:px-8 lg:px-12 mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-border-subtle">
          {/* Brand Col */}
          <div className="col-span-2 flex flex-col gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onLaunchConsole('test-runs')}
            >
              <img
                alt="GhostRunner Logo"
                className="h-7 w-auto object-contain"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWipWggVeqSAcbSqiwXIe3oGk4VZEyU7NwyTuoqToHWKaTPoZ5RJABX3rk5CE7aD5cii7FeWroTg92xPIpxEmgW0HTJKs93o1w58hcwVv45oH45FXawQLOCJt3TnanUx5U3V2CxIHvCqH27gd9AyAS9zsa_kL__LEDAaXRyW2BKSoYtqyJzIIu9KmTw2ZkYsHWNEXaBsqwsh9AUnUd5X0gfZDhwkbAVQZSDiMsREPg0S1bQAogwtOllsm7ZVzjOj7tfg"
              />
              <span className="font-headline-sm text-text-primary tracking-tight font-bold">
                GhostRunner
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-xs">
              Autonomous, self-healing test automation framework powered by heuristic visual and DOM
              intelligence.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success-subtle text-status-success border border-status-success/30 font-code-sm text-xs w-max mt-2">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              <span>Systems Operational 99.99%</span>
            </div>
          </div>

          {/* Column 1: PRODUCT */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider font-label-sm">
              PRODUCT
            </span>
            <button
              onClick={() => onLaunchConsole('test-runs')}
              className="text-text-secondary hover:text-text-primary text-left"
            >
              Self-Healing Engine
            </button>
            <button
              onClick={() => onLaunchConsole('test-runs')}
              className="text-text-secondary hover:text-text-primary text-left"
            >
              Visual Flow Studio
            </button>
            <button
              onClick={() => onLaunchConsole('dashboard')}
              className="text-text-secondary hover:text-text-primary text-left"
            >
              CI/CD Cloud Matrix
            </button>
            <button
              onClick={() => onLaunchConsole('healing-queue')}
              className="text-text-secondary hover:text-text-primary text-left"
            >
              Autonomous Healers
            </button>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Changelog
            </span>
          </div>

          {/* Column 2: SOLUTIONS */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider font-label-sm">
              SOLUTIONS
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Web & SPA Testing
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Micro-Frontend Suites
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Nightly Regression
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Flaky Test Elimination
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Multi-Browser Matrix
            </span>
          </div>

          {/* Column 3: DEVELOPERS */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider font-label-sm">
              DEVELOPERS
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              API Reference
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              CLI Documentation
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Playwright Extension
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              GitHub Action
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Community Discord
            </span>
          </div>

          {/* Column 4: COMPANY & LEGAL */}
          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider font-label-sm">
              COMPANY
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              About Us
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Engineering Blog
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Careers
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Customers
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Press Kit
            </span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <span className="font-bold text-text-primary uppercase tracking-wider font-label-sm">
              SECURITY & LEGAL
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Privacy Policy
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Terms of Service
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Trust & Compliance
            </span>
            <span className="text-text-secondary hover:text-text-primary cursor-pointer">
              Security Portal
            </span>
            <span className="text-text-muted mt-2">SOC2 Type II • HIPAA Ready</span>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="max-w-6xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>© 2025 GhostRunner Labs Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="font-mono">v4.18.2-cloud</span>
            <span className="hover:text-text-secondary cursor-pointer">Status</span>
            <span className="hover:text-text-secondary cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
