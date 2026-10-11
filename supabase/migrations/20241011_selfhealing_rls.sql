-- GhostRunner: Self-Healing System completion migration
-- Adds UPDATE RLS policy for test_definitions so the webhook server (service role)
-- can promote a new test_version as active after a repair is approved.

-- Also enables Realtime on the tables that the frontend subscribes to.

-- ── test_definitions: allow owner UPDATE (needed for active_version_id promotion) ──
drop policy if exists "test_definitions_update_own" on public.test_definitions;
create policy "test_definitions_update_own" on public.test_definitions
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- ── test_versions: allow owner INSERT (creating new healed versions) ─────────────
drop policy if exists "test_versions_insert_own" on public.test_versions;
create policy "test_versions_insert_own" on public.test_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.test_definitions td
      where td.id = test_definition_id
        and td.owner_id = (select auth.uid())
    )
  );

-- ── Enable Realtime on test_runs (for RunDetailPage live status) ──────────────────
-- NOTE: Realtime must also be enabled via the Supabase Dashboard UI:
--   Database → Replication → Supabase Realtime → enable for test_runs, repair_proposals
alter publication supabase_realtime add table public.test_runs;
alter publication supabase_realtime add table public.repair_proposals;
