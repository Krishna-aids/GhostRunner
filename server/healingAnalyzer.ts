/**
 * GhostRunner — Self-Healing Failure Analyzer (Groq LLM)
 *
 * When a test run finishes with a non-zero exit code, this module:
 *  1. Sends the failure logs to Groq (llama-3.3-70b-versatile) for analysis
 *  2. Gets back a structured repair proposal (classification + proposed_plan)
 *  3. Updates the test_run row with classification + confidence
 *  4. Inserts a repair_proposals row into Supabase
 *
 * Requires: GROQ_API_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = 'qwen/qwen3-32b';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Types ────────────────────────────────────────────────────────────────────

type FailureCategory =
  | 'LOCATOR_DRIFT'
  | 'UI_FUNCTIONAL_REGRESSION'
  | 'API_FAILURE'
  | 'ASSERTION_FAILURE'
  | 'ENVIRONMENT_FAILURE'
  | 'AMBIGUOUS_REQUIRES_REVIEW';

interface HealingAnalysis {
  classification: FailureCategory;
  confidence: number; // 0.0–1.0
  reason: string;
  proposed_plan: {
    steps: Array<{
      action: string;
      target: Record<string, string | null>;
      value: string | null;
      timeout_ms: number;
    }>;
    required_assertions: Array<{
      type: string;
      target: Record<string, string | null> | string;
      expected_value: string | null;
      description: string | null;
    }>;
  };
}

// ── Groq call ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are GhostRunner's self-healing AI — an expert in end-to-end test failure analysis.

When given test failure logs, you MUST respond with ONLY a valid JSON object (no markdown, no prose) with this exact structure:
{
  "classification": "<one of: LOCATOR_DRIFT | UI_FUNCTIONAL_REGRESSION | API_FAILURE | ASSERTION_FAILURE | ENVIRONMENT_FAILURE | AMBIGUOUS_REQUIRES_REVIEW>",
  "confidence": <float 0.0 to 1.0>,
  "reason": "<concise one-sentence explanation of root cause>",
  "proposed_plan": {
    "steps": [
      { "action": "<navigate|click|fill|assert_visible|assert_text>", "target": { "role": null, "name": null, "selector": "<css or aria>", "url": null }, "value": null, "timeout_ms": 5000 }
    ],
    "required_assertions": []
  }
}

Classification rules:
- LOCATOR_DRIFT: selector/element not found, timeout waiting for element, element moved in DOM
- UI_FUNCTIONAL_REGRESSION: element found but behavior changed (click doesn't work, wrong page)
- API_FAILURE: network error, HTTP 4xx/5xx response, timeout in fetch/XHR
- ASSERTION_FAILURE: expect() assertion failed, wrong text/value
- ENVIRONMENT_FAILURE: browser crash, missing env vars, npm/binary errors
- AMBIGUOUS_REQUIRES_REVIEW: unclear from logs`;

async function callGroq(logs: string, framework: string, repo: string): Promise<HealingAnalysis | null> {
  if (!GROQ_API_KEY) {
    console.warn('   ⚠️  GROQ_API_KEY not set — skipping AI healing analysis');
    return null;
  }

  // Truncate logs to last 3000 chars to stay within context limits
  const truncatedLogs = logs.length > 3000 ? '...(truncated)\n' + logs.slice(-3000) : logs;

  const userMessage = `Repository: ${repo}
Test Framework: ${framework}

FAILURE LOGS:
\`\`\`
${truncatedLogs}
\`\`\`

Analyze this test failure and produce a JSON repair proposal.`;

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,  // low temperature for deterministic structured output
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`   ❌ Groq API error: ${res.status} ${body}`);
      return null;
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as HealingAnalysis;

    // Validate essential fields
    if (!parsed.classification || parsed.confidence == null || !parsed.reason) {
      console.warn('   ⚠️  Groq response missing required fields');
      return null;
    }

    // Clamp confidence to 0–1
    parsed.confidence = Math.min(1.0, Math.max(0.0, Number(parsed.confidence)));

    return parsed;
  } catch (err) {
    console.error('   ❌ Groq call failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Main export ──────────────────────────────────────────────────────────────

export interface AnalyzeFailureOptions {
  runId: string;
  testDefinitionId: string;
  fromVersionId: string;
  logs: string;
  framework: string;
  repoFullName: string;
}

/**
 * Analyze a failed test run using Groq, then write the results to Supabase.
 * This is called async (fire-and-forget) by testRunner.ts after a failure.
 */
export async function analyzeFailureAndHeal(opts: AnalyzeFailureOptions): Promise<void> {
  const { runId, testDefinitionId, fromVersionId, logs, framework, repoFullName } = opts;

  console.log(`\n🧠 [healingAnalyzer] Analyzing failure for run ${runId} with Groq (${GROQ_MODEL})...`);

  const supabase = getSupabase();
  if (!supabase) {
    console.warn('   ⚠️  Supabase not configured — cannot save healing analysis');
    return;
  }

  const analysis = await callGroq(logs, framework, repoFullName);

  if (!analysis) {
    // Groq unavailable — still mark as needs_review so it shows in queue
    await supabase
      .from('test_runs')
      .update({
        status: 'needs_review',
        classification: 'AMBIGUOUS_REQUIRES_REVIEW',
        confidence: 0.0,
        summary: 'Automated analysis unavailable — manual review required.',
      })
      .eq('id', runId);
    return;
  }

  console.log(`   ✅ Groq classified: ${analysis.classification} (${Math.round(analysis.confidence * 100)}% confidence)`);

  // Update run: classification + confidence + status → repair_proposed
  await supabase
    .from('test_runs')
    .update({
      status: 'repair_proposed',
      classification: analysis.classification,
      confidence: analysis.confidence,
      summary: analysis.reason,
    })
    .eq('id', runId);

  // Insert repair proposal
  const { error: propError } = await supabase
    .from('repair_proposals')
    .insert({
      test_run_id: runId,
      from_version_id: fromVersionId,
      proposed_plan: analysis.proposed_plan,
      reason: analysis.reason,
      evidence_refs: [],
      confidence: analysis.confidence,
      validation_status: 'pending',
      validation_run_id: null,
    });

  if (propError) {
    console.error(`   ❌ Failed to insert repair proposal: ${propError.message}`);
    return;
  }

  console.log(`   ✅ Repair proposal created for run ${runId}`);
}
