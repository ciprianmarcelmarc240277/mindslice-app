create table if not exists public.author_reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  author_id text not null,
  concept_id text,
  from_rank text not null,
  to_rank text not null,
  event_type text not null default 'RANK_PROMOTION',
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists author_reputation_events_user_created_at_idx
  on public.author_reputation_events (user_id, created_at desc);

create index if not exists author_reputation_events_author_created_at_idx
  on public.author_reputation_events (author_id, created_at desc);

alter table public.author_reputation_events enable row level security;

drop policy if exists "author_reputation_events_owner_read" on public.author_reputation_events;
create policy "author_reputation_events_owner_read"
  on public.author_reputation_events
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_reputation_events_owner_insert" on public.author_reputation_events;
create policy "author_reputation_events_owner_insert"
  on public.author_reputation_events
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_reputation_events_owner_delete" on public.author_reputation_events;
create policy "author_reputation_events_owner_delete"
  on public.author_reputation_events
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
