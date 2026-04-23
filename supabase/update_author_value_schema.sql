create table if not exists public.mindslice_author_value_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  author_id text not null,
  concept_id text,
  classification text,
  current_rank text,
  next_rank text,
  promoted boolean not null default false,
  canonical_state boolean not null default false,
  contribution_score numeric not null default 0,
  consistency_score numeric not null default 0,
  canon_score numeric not null default 0,
  influence_score numeric not null default 0,
  growth_score numeric not null default 0,
  journal_score numeric not null default 0,
  structure_score numeric not null default 0,
  slice_score numeric not null default 0,
  coordination_score numeric not null default 0,
  decision_score numeric not null default 0,
  total_value numeric not null default 0,
  profile_payload jsonb not null default '{}'::jsonb,
  reputation_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.mindslice_author_value_states
  add column if not exists current_rank text,
  add column if not exists next_rank text,
  add column if not exists promoted boolean not null default false,
  add column if not exists journal_score numeric not null default 0,
  add column if not exists structure_score numeric not null default 0,
  add column if not exists slice_score numeric not null default 0,
  add column if not exists coordination_score numeric not null default 0,
  add column if not exists decision_score numeric not null default 0,
  add column if not exists reputation_payload jsonb not null default '{}'::jsonb;

create index if not exists mindslice_author_value_states_user_created_at_idx
  on public.mindslice_author_value_states (user_id, created_at desc);

create index if not exists mindslice_author_value_states_author_created_at_idx
  on public.mindslice_author_value_states (author_id, created_at desc);

alter table public.mindslice_author_value_states enable row level security;

drop policy if exists "mindslice_author_value_states_owner_read" on public.mindslice_author_value_states;
create policy "mindslice_author_value_states_owner_read"
  on public.mindslice_author_value_states
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_author_value_states_owner_insert" on public.mindslice_author_value_states;
create policy "mindslice_author_value_states_owner_insert"
  on public.mindslice_author_value_states
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_author_value_states_owner_delete" on public.mindslice_author_value_states;
create policy "mindslice_author_value_states_owner_delete"
  on public.mindslice_author_value_states
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
