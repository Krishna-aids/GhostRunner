/**
 * seed-demo.cjs
 *
 * Seeds Supabase with a demo project + test definition for the
 * ghostrunner-demo-store repo (Krishna-aids/Demo).
 *
 * Run once: node seed-demo.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xjgxnpnfeabiyqsdyljo.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZ3hucG5mZWFiaXlxc2R5bGpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTY0MjgwMywiZXhwIjoyMTA3MjE4ODAzfQ.afXXF74K_WK7KChK8Jbhsnc8xtrghEWayACuESmoctc';

// ⚠️ Update INSTALLATION_ID with your actual GitHub App installation ID
// Find it at: https://github.com/settings/installations → click your GhostRunner app
const INSTALLATION_ID = process.env.INSTALLATION_ID || '170228617';
const REPO_FULL_NAME  = 'Krishna-aids/Demo';
const OWNER_ID        = 'user-demo-1406'; // matches DEMO_USER in AuthContext

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function seed() {
  console.log('🌱 Seeding GhostRunner demo project in Supabase...\n');

  // 1. Create (or find) the demo project
  let projectId;
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .contains('repo_metadata', { full_name: REPO_FULL_NAME })
    .limit(1);

  if (existing && existing.length > 0) {
    projectId = existing[0].id;
    console.log(`✅ Project already exists: ${projectId}`);
  } else {
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        owner_id: OWNER_ID,
        name: 'Demo Store',
        repo_metadata: {
          full_name:       REPO_FULL_NAME,
          github_url:      `github.com/${REPO_FULL_NAME}`,
          installation_id: INSTALLATION_ID,
          branch:          'main',
          stack:           'Node.js + Express',
          connected:       true,
          last_synced:     new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (pErr) { console.error('❌ Project insert failed:', pErr.message); process.exit(1); }
    projectId = project.id;
    console.log(`✅ Created project: ${projectId}`);
  }

  // 2. Create a test definition for the checkout flow
  const { data: existingTest } = await supabase
    .from('test_definitions')
    .select('id, active_version_id')
    .eq('project_id', projectId)
    .limit(1);

  let testId, versionId;

  if (existingTest && existingTest.length > 0) {
    testId    = existingTest[0].id;
    versionId = existingTest[0].active_version_id;
    console.log(`✅ Test definition already exists: ${testId}`);
  } else {
    // Step 1: Create test_definition first (active_version_id = null temporarily)
    const { data: test, error: tErr } = await supabase
      .from('test_definitions')
      .insert({
        project_id:        projectId,
        owner_id:          OWNER_ID,
        name:              'Checkout Flow',
        original_intent:   'User visits the store homepage, clicks the Checkout button, and sees an order confirmation message with an order ID.',
        required_assertions: [
          {
            type:          'text_contains',
            target:        { selector: '#status' },
            expected_value:'Order confirmed',
            description:   'Success banner shows after checkout',
          },
        ],
        preconditions:       {},
        active_version_id:   null,
      })
      .select()
      .single();

    if (tErr) { console.error('❌ Test definition insert failed:', tErr.message); process.exit(1); }
    testId = test.id;
    console.log(`✅ Created test definition: ${testId}`);

    // Step 2: Create version pointing to the test definition
    const { data: version, error: vErr } = await supabase
      .from('test_versions')
      .insert({
        test_definition_id:  testId,
        version_number:      1,
        repository_revision: 'main',
        created_by:          'GhostRunner Demo Seed',
        change_reason:       'Initial checkout flow test',
        action_plan: {
          steps: [
            { action: 'navigate',       target: { url: 'http://localhost:3001' }, value: null, timeout_ms: 5000 },
            { action: 'click',          target: { selector: '#checkout-btn' },    value: null, timeout_ms: 5000 },
            { action: 'assert_visible', target: { selector: '#status.success' },  value: null, timeout_ms: 10000 },
          ],
          required_assertions: [
            { type: 'text_contains', target: { selector: '#status' }, expected_value: 'Order confirmed', description: 'Order confirmation appears' },
          ],
        },
        assertions_snapshot: [],
      })
      .select()
      .single();

    if (vErr) { console.error('❌ Version insert failed:', vErr.message); process.exit(1); }
    versionId = version.id;
    console.log(`✅ Created test version:    ${versionId}`);

    // Step 3: Update test_definition with the real active_version_id
    await supabase
      .from('test_definitions')
      .update({ active_version_id: versionId })
      .eq('id', testId);

  }

  console.log('\n📋 Summary:');
  console.log(`   Repo:    ${REPO_FULL_NAME}`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Test:    ${testId}`);
  console.log(`   Version: ${versionId}`);
  console.log('\n🎉 Done! Push to GitHub to trigger GhostRunner.\n');
}

seed().catch(console.error);
