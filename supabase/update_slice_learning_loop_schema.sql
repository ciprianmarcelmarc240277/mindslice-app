create table if not exists public.mindslice_slice_learning_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  slice_id text not null,
  cluster_id text,
  cycle_status text not null
    check (cycle_status in ('success', 'failure', 'fragment', 'canonical_candidate')),
  classification text not null
    check (classification in ('NOISE', 'FRAGMENT', 'PRE_CONCEPT', 'CONCEPT', 'CANONICAL_CANDIDATE')),
  canonical_state text not null default 'NON_CANON',
  score_total numeric,
  repetition_type text
    check (repetition_type in ('NEW_SLICE', 'STATIC_REPETITION', 'PROGRESSIVE_REPETITION', 'TRANSFORMATIVE_REPETITION')),
  updated_state jsonb not null default '{}'::jsonb,
  learning_summary jsonb not null default '{}'::jsonb,
  full_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mindslice_slice_learning_cycles_user_slice_unique unique (user_id, slice_id)
);

create index if not exists mindslice_slice_learning_cycles_user_updated_at_idx
  on public.mindslice_slice_learning_cycles (user_id, updated_at desc);

alter table public.mindslice_slice_learning_cycles enable row level security;

drop policy if exists "mindslice_slice_learning_cycles_owner_read" on public.mindslice_slice_learning_cycles;
create policy "mindslice_slice_learning_cycles_owner_read"
  on public.mindslice_slice_learning_cycles
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_learning_cycles_owner_insert" on public.mindslice_slice_learning_cycles;
create policy "mindslice_slice_learning_cycles_owner_insert"
  on public.mindslice_slice_learning_cycles
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_learning_cycles_owner_update" on public.mindslice_slice_learning_cycles;
create policy "mindslice_slice_learning_cycles_owner_update"
  on public.mindslice_slice_learning_cycles
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_slice_learning_cycles_owner_delete" on public.mindslice_slice_learning_cycles;
create policy "mindslice_slice_learning_cycles_owner_delete"
  on public.mindslice_slice_learning_cycles
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
