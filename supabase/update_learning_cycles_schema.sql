create table if not exists public.mindslice_learning_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  cycle_status text not null
    check (cycle_status in ('success', 'failure', 'refined', 'canonical_candidate')),
  classification text not null
    check (classification in ('NOISE', 'FRAGMENT', 'PRE_CONCEPT', 'CONCEPT', 'CANONICAL_CANDIDATE')),
  decision text not null
    check (decision in ('RESTART', 'LOOP_BACK', 'REFINE', 'STORE', 'CANON_CHECK')),
  score_total numeric not null default 0,
  canonical_state boolean not null default false,
  failure_reason text,
  payload_mode text not null default 'compact'
    check (payload_mode in ('compact', 'full')),
  payload_size integer not null default 0,
  retention_tier text not null default 'standard'
    check (retention_tier in ('short', 'standard', 'long', 'canonical')),
  threshold_state jsonb not null default '{}'::jsonb,
  decision_flags jsonb not null default '{}'::jsonb,
  updated_state jsonb not null default '{}'::jsonb,
  slice_repetition_state jsonb not null default '{}'::jsonb,
  learning_summary jsonb not null default '{}'::jsonb,
  full_payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.mindslice_learning_cycles
  add column if not exists slice_repetition_state jsonb not null default '{}'::jsonb;

create index if not exists mindslice_learning_cycles_user_created_at_idx
  on public.mindslice_learning_cycles (user_id, created_at desc);

create index if not exists mindslice_learning_cycles_user_classification_idx
  on public.mindslice_learning_cycles (user_id, classification, created_at desc);

alter table public.mindslice_learning_cycles enable row level security;

drop policy if exists "mindslice_learning_cycles_owner_read" on public.mindslice_learning_cycles;
create policy "mindslice_learning_cycles_owner_read"
  on public.mindslice_learning_cycles
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_learning_cycles_owner_insert" on public.mindslice_learning_cycles;
create policy "mindslice_learning_cycles_owner_insert"
  on public.mindslice_learning_cycles
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_learning_cycles_owner_delete" on public.mindslice_learning_cycles;
create policy "mindslice_learning_cycles_owner_delete"
  on public.mindslice_learning_cycles
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
