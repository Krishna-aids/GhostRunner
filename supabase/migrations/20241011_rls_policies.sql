-- GhostRunner RLS Policies
-- Ensures authenticated users can only access their own data
-- via owner_id = auth.uid()

-- ── Enable RLS on all tables ─────────────────────────────────────────────────
alter table if exists public.projects enable row level security;
alter table if exists public.test_definitions enable row level security;
alter table if exists public.test_versions enable row level security;
alter table if exists public.test_runs enable row level security;
alter table if exists public.evidence_artifacts enable row level security;
alter table if exists public.repair_proposals enable row level security;

-- ── projects ─────────────────────────────────────────────────────────────────
drop policy if exists "projects_select" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "projects_delete" on public.projects;

create policy "projects_select" on public.projects
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "projects_insert" on public.projects
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "projects_update" on public.projects
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "projects_delete" on public.projects
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ── test_definitions ─────────────────────────────────────────────────────────
drop policy if exists "test_definitions_select" on public.test_definitions;
drop policy if exists "test_definitions_insert" on public.test_definitions;
drop policy if exists "test_definitions_update" on public.test_definitions;
drop policy if exists "test_definitions_delete" on public.test_definitions;

create policy "test_definitions_select" on public.test_definitions
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "test_definitions_insert" on public.test_definitions
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "test_definitions_update" on public.test_definitions
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "test_definitions_delete" on public.test_definitions
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ── test_versions ─────────────────────────────────────────────────────────────
-- Linked via test_definition; let the owner access their test versions
drop policy if exists "test_versions_select" on public.test_versions;
drop policy if exists "test_versions_insert" on public.test_versions;

create policy "test_versions_select" on public.test_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.test_definitions td
      where td.id = test_versions.test_definition_id
        and (select auth.uid()) = td.owner_id
    )
  );

create policy "test_versions_insert" on public.test_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.test_definitions td
      where td.id = test_versions.test_definition_id
        and (select auth.uid()) = td.owner_id
    )
  );

-- ── test_runs ─────────────────────────────────────────────────────────────────
drop policy if exists "test_runs_select" on public.test_runs;
drop policy if exists "test_runs_insert" on public.test_runs;
drop policy if exists "test_runs_update" on public.test_runs;

create policy "test_runs_select" on public.test_runs
  for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "test_runs_insert" on public.test_runs
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "test_runs_update" on public.test_runs
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- ── evidence_artifacts ───────────────────────────────────────────────────────
drop policy if exists "evidence_artifacts_select" on public.evidence_artifacts;
drop policy if exists "evidence_artifacts_insert" on public.evidence_artifacts;

create policy "evidence_artifacts_select" on public.evidence_artifacts
  for select to authenticated
  using (
    exists (
      select 1 from public.test_runs tr
      where tr.id = evidence_artifacts.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  );

create policy "evidence_artifacts_insert" on public.evidence_artifacts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.test_runs tr
      where tr.id = evidence_artifacts.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  );

-- ── repair_proposals ─────────────────────────────────────────────────────────
drop policy if exists "repair_proposals_select" on public.repair_proposals;
drop policy if exists "repair_proposals_insert" on public.repair_proposals;
drop policy if exists "repair_proposals_update" on public.repair_proposals;

create policy "repair_proposals_select" on public.repair_proposals
  for select to authenticated
  using (
    exists (
      select 1 from public.test_runs tr
      where tr.id = repair_proposals.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  );

create policy "repair_proposals_insert" on public.repair_proposals
  for insert to authenticated
  with check (
    exists (
      select 1 from public.test_runs tr
      where tr.id = repair_proposals.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  );

create policy "repair_proposals_update" on public.repair_proposals
  for update to authenticated
  using (
    exists (
      select 1 from public.test_runs tr
      where tr.id = repair_proposals.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  )
  with check (
    exists (
      select 1 from public.test_runs tr
      where tr.id = repair_proposals.test_run_id
        and (select auth.uid()) = tr.owner_id
    )
  );
