create table if not exists public.users (
  user_id text primary key,
  provider text not null default 'clerk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.author_identities (
  identity_id uuid primary key default gen_random_uuid(),
  user_id text not null unique references public.profiles(user_id) on delete cascade,
  type text not null default 'pseudonym'
    check (type in ('pseudonym', 'indexed')),
  pseudonym text,
  first_name text,
  last_name text,
  indexed_name text,
  consent_flag boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.author_roles (
  user_id text primary key references public.profiles(user_id) on delete cascade,
  role text not null default 'free'
    check (role in ('free', 'author', 'active_author')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists author_identities_user_type_idx
  on public.author_identities (user_id, type);

create index if not exists author_roles_role_idx
  on public.author_roles (role);

alter table public.users enable row level security;
alter table public.author_identities enable row level security;
alter table public.author_roles enable row level security;

drop policy if exists "users_owner_read" on public.users;
create policy "users_owner_read"
  on public.users
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "users_owner_insert" on public.users;
create policy "users_owner_insert"
  on public.users
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "users_owner_update" on public.users;
create policy "users_owner_update"
  on public.users
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "users_owner_delete" on public.users;
create policy "users_owner_delete"
  on public.users
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_identities_owner_read" on public.author_identities;
create policy "author_identities_owner_read"
  on public.author_identities
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_identities_owner_insert" on public.author_identities;
create policy "author_identities_owner_insert"
  on public.author_identities
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_identities_owner_update" on public.author_identities;
create policy "author_identities_owner_update"
  on public.author_identities
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_identities_owner_delete" on public.author_identities;
create policy "author_identities_owner_delete"
  on public.author_identities
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_roles_owner_read" on public.author_roles;
create policy "author_roles_owner_read"
  on public.author_roles
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_roles_owner_insert" on public.author_roles;
create policy "author_roles_owner_insert"
  on public.author_roles
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_roles_owner_update" on public.author_roles;
create policy "author_roles_owner_update"
  on public.author_roles
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "author_roles_owner_delete" on public.author_roles;
create policy "author_roles_owner_delete"
  on public.author_roles
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
