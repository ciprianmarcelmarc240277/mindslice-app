create table if not exists public.mindslice_slice_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  cluster_id text not null,
  semantic_axis text,
  dominant_axis text,
  total_slices integer not null default 0,
  evolution_path jsonb not null default '[]'::jsonb,
  cluster_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mindslice_slice_clusters_user_cluster_unique unique (user_id, cluster_id)
);

create table if not exists public.mindslice_slice_repetition_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  slice_id text not null,
  cluster_id text not null,
  semantic_axis text,
  similarity numeric not null default 0,
  repetition_type text not null
    check (repetition_type in ('NEW_SLICE', 'STATIC_REPETITION', 'PROGRESSIVE_REPETITION', 'TRANSFORMATIVE_REPETITION')),
  evolution jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  slice_text text,
  slice_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mindslice_slice_repetitions_user_slice_unique unique (user_id, slice_id)
);

create index if not exists mindslice_slice_clusters_user_updated_at_idx
  on public.mindslice_slice_clusters (user_id, updated_at desc);

create index if not exists mindslice_slice_repetitions_user_created_at_idx
  on public.mindslice_slice_repetition_states (user_id, created_at desc);

create index if not exists mindslice_slice_repetitions_user_cluster_idx
  on public.mindslice_slice_repetition_states (user_id, cluster_id, updated_at desc);

alter table public.mindslice_slice_clusters enable row level security;
alter table public.mindslice_slice_repetition_states enable row level security;

drop policy if exists "mindslice_slice_clusters_owner_read" on public.mindslice_slice_clusters;
create policy "mindslice_slice_clusters_owner_read"
  on public.mindslice_slice_clusters
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_clusters_owner_insert" on public.mindslice_slice_clusters;
create policy "mindslice_slice_clusters_owner_insert"
  on public.mindslice_slice_clusters
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_clusters_owner_update" on public.mindslice_slice_clusters;
create policy "mindslice_slice_clusters_owner_update"
  on public.mindslice_slice_clusters
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_clusters_owner_delete" on public.mindslice_slice_clusters;
create policy "mindslice_slice_clusters_owner_delete"
  on public.mindslice_slice_clusters
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_repetitions_owner_read" on public.mindslice_slice_repetition_states;
create policy "mindslice_slice_repetitions_owner_read"
  on public.mindslice_slice_repetition_states
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_repetitions_owner_insert" on public.mindslice_slice_repetition_states;
create policy "mindslice_slice_repetitions_owner_insert"
  on public.mindslice_slice_repetition_states
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_repetitions_owner_update" on public.mindslice_slice_repetition_states;
create policy "mindslice_slice_repetitions_owner_update"
  on public.mindslice_slice_repetition_states
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_repetitions_owner_delete" on public.mindslice_slice_repetition_states;
create policy "mindslice_slice_repetitions_owner_delete"
  on public.mindslice_slice_repetition_states
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
