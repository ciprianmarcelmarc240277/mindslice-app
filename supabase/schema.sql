create extension if not exists "pgcrypto";

create table if not exists public.users (
  user_id text primary key,
  provider text not null default 'clerk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  pseudonym text,
  email text,
  avatar_url text,
  name_declaration_accepted boolean not null default false,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'active', 'past_due', 'canceled')),
  subscription_expires_at timestamptz,
  artist_statement text,
  debut_status text not null default 'aspirant'
    check (debut_status in ('aspirant', 'in_program', 'selected', 'published', 'alumni')),
  debut_joined_at timestamptz,
  debut_selected_at timestamptz,
  debut_published_at timestamptz,
  address_form text check (address_form in ('domnule', 'doamnă', 'domnișoară')),
  bio text,
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

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists pseudonym text;

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.profiles
  add column if not exists name_declaration_accepted boolean not null default false;

alter table public.profiles
  add column if not exists subscription_status text not null default 'inactive'
  check (subscription_status in ('inactive', 'active', 'past_due', 'canceled'));

alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

alter table public.profiles
  add column if not exists artist_statement text;

alter table public.profiles
  add column if not exists debut_status text not null default 'aspirant'
  check (debut_status in ('aspirant', 'in_program', 'selected', 'published', 'alumni'));

alter table public.profiles
  add column if not exists debut_joined_at timestamptz;

alter table public.profiles
  add column if not exists debut_selected_at timestamptz;

alter table public.profiles
  add column if not exists debut_published_at timestamptz;

alter table public.profiles
  add column if not exists address_form text
  check (address_form in ('domnule', 'doamnă', 'domnișoară'));

alter table public.profiles
  add column if not exists bio text;

create index if not exists author_identities_user_type_idx
  on public.author_identities (user_id, type);

create index if not exists author_roles_role_idx
  on public.author_roles (role);

create table if not exists public.saved_moments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  direction text not null,
  thought text not null,
  prompt text not null,
  image_url text,
  slice_index integer,
  mood text,
  palette text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  saved_moment_id uuid not null references public.saved_moments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_user_saved_moment_unique unique (user_id, saved_moment_id)
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  saved_moment_id uuid references public.saved_moments(id) on delete set null,
  title text not null,
  excerpt text,
  source_text text,
  content text not null,
  ai_response_text text,
  ai_response_generated_at timestamptz,
  cover_image_url text,
  is_debut_submission boolean not null default false,
  is_debut_selected boolean not null default false,
  is_debut_published boolean not null default false,
  sense_weight numeric not null default 0,
  structure_weight numeric not null default 0,
  attention_weight numeric not null default 0,
  influence_mode text not null default 'whisper' check (influence_mode in ('whisper', 'echo', 'rupture', 'counterpoint', 'stain')),
  is_contaminant boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts
  add column if not exists source_text text;

alter table public.blog_posts
  add column if not exists ai_response_text text;

alter table public.blog_posts
  add column if not exists ai_response_generated_at timestamptz;

alter table public.blog_posts
  add column if not exists is_debut_submission boolean not null default false;

alter table public.blog_posts
  add column if not exists is_debut_selected boolean not null default false;

alter table public.blog_posts
  add column if not exists is_debut_published boolean not null default false;

alter table public.blog_posts
  add column if not exists sense_weight numeric not null default 0;

alter table public.blog_posts
  add column if not exists structure_weight numeric not null default 0;

alter table public.blog_posts
  add column if not exists attention_weight numeric not null default 0;

alter table public.blog_posts
  add column if not exists influence_mode text not null default 'whisper'
  check (influence_mode in ('whisper', 'echo', 'rupture', 'counterpoint', 'stain'));

alter table public.blog_posts
  add column if not exists is_contaminant boolean not null default true;

alter table public.blog_posts
  add column if not exists published_at timestamptz;

create table if not exists public.user_settings (
  user_id text primary key references public.profiles(user_id) on delete cascade,
  language text not null default 'ro',
  autoplay_enabled boolean not null default true,
  preferred_view text not null default 'gallery',
  show_blog boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thought_memory (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  source_type text not null default 'live_slice'
    check (source_type in ('live_slice', 'journal_contamination')),
  direction text not null,
  thought text not null,
  fragments text[] not null default '{}',
  keywords text[] not null default '{}',
  sense_score numeric not null default 0,
  structure_score numeric not null default 0,
  attention_score numeric not null default 0,
  influence_mode text
    check (influence_mode in ('whisper', 'echo', 'rupture', 'counterpoint', 'stain')),
  memory_weight numeric not null default 0.4,
  created_at timestamptz not null default now()
);

create table if not exists public.interior_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pseudonym_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id text not null references public.profiles(user_id) on delete cascade,
  followed_user_id text not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint pseudonym_follows_unique unique (follower_user_id, followed_user_id),
  constraint pseudonym_follows_no_self check (follower_user_id <> followed_user_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.concepts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  concept_key text not null,
  source_idea_id text not null,
  title text not null,
  one_line_definition text,
  thesis text not null,
  tension text,
  resolution_claim text,
  stage text not null
    check (stage in ('emergent', 'forming', 'stabilizing', 'resolved', 'canonical')),
  resolution_status text not null
    check (resolution_status in ('unresolved', 'partially_resolved', 'resolved', 'contested')),
  semantic_score numeric not null default 0,
  visual_score numeric not null default 0,
  cross_modal_score numeric not null default 0,
  contamination_score numeric not null default 0,
  author_alignment_score numeric not null default 0,
  overall_score numeric not null default 0,
  is_canonical boolean not null default false,
  promoted_at timestamptz,
  concept_state jsonb not null default '{}'::jsonb,
  validation_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concepts_user_concept_key_unique unique (user_id, concept_key)
);

create table if not exists public.concept_artifacts (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  artifact_type text not null
    check (artifact_type in ('text', 'visual_snapshot', 'graph_state', 'prompt', 'hybrid')),
  content_text text,
  content_json jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concept_artifacts_concept_type_unique unique (concept_id, artifact_type)
);

create table if not exists public.engine_debug_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.mindslice_memory_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  domain text not null check (domain in ('narrative', 'art', 'structure', 'color', 'shape', 'shape_grammar', 'meta_system')),
  entry_id text not null,
  entry_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mindslice_memory_states_user_domain_entry_unique unique (user_id, domain, entry_id)
);

create table if not exists public.mindslice_canon_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.profiles(user_id) on delete cascade,
  domain text not null check (domain in ('narrative', 'art', 'structure', 'color', 'shape', 'shape_grammar', 'meta_system')),
  entry_id text not null,
  entry_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mindslice_canon_states_user_domain_entry_unique unique (user_id, domain, entry_id)
);

create index if not exists saved_moments_user_id_created_at_idx
  on public.saved_moments (user_id, created_at desc);

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists blog_posts_user_id_status_created_at_idx
  on public.blog_posts (user_id, status, created_at desc);

create index if not exists thought_memory_user_id_created_at_idx
  on public.thought_memory (user_id, created_at desc);

create index if not exists interior_chat_messages_created_at_idx
  on public.interior_chat_messages (created_at desc);

create index if not exists pseudonym_follows_follower_created_at_idx
  on public.pseudonym_follows (follower_user_id, created_at desc);

create index if not exists collections_user_id_created_at_idx
  on public.collections (user_id, created_at desc);

create index if not exists concepts_user_id_created_at_idx
  on public.concepts (user_id, created_at desc);

create index if not exists concepts_user_id_stage_updated_at_idx
  on public.concepts (user_id, stage, updated_at desc);

create index if not exists concept_artifacts_concept_id_created_at_idx
  on public.concept_artifacts (concept_id, created_at desc);

create index if not exists engine_debug_runs_user_id_created_at_idx
  on public.engine_debug_runs (user_id, created_at desc);

create index if not exists mindslice_memory_states_user_domain_updated_at_idx
  on public.mindslice_memory_states (user_id, domain, updated_at desc);

create index if not exists mindslice_canon_states_user_domain_updated_at_idx
  on public.mindslice_canon_states (user_id, domain, updated_at desc);

alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.author_identities enable row level security;
alter table public.author_roles enable row level security;
alter table public.saved_moments enable row level security;
alter table public.favorites enable row level security;
alter table public.blog_posts enable row level security;
alter table public.user_settings enable row level security;
alter table public.thought_memory enable row level security;
alter table public.interior_chat_messages enable row level security;
alter table public.pseudonym_follows enable row level security;
alter table public.collections enable row level security;
alter table public.concepts enable row level security;
alter table public.concept_artifacts enable row level security;
alter table public.engine_debug_runs enable row level security;
alter table public.mindslice_memory_states enable row level security;
alter table public.mindslice_canon_states enable row level security;

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

drop policy if exists "profiles_owner_read" on public.profiles;
create policy "profiles_owner_read"
  on public.profiles
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "profiles_owner_insert" on public.profiles;
create policy "profiles_owner_insert"
  on public.profiles
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update"
  on public.profiles
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "profiles_owner_delete" on public.profiles;
create policy "profiles_owner_delete"
  on public.profiles
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "profiles_authenticated_directory_read" on public.profiles;
create policy "profiles_authenticated_directory_read"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

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

drop policy if exists "saved_moments_owner_read" on public.saved_moments;
create policy "saved_moments_owner_read"
  on public.saved_moments
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "saved_moments_owner_insert" on public.saved_moments;
create policy "saved_moments_owner_insert"
  on public.saved_moments
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "saved_moments_owner_update" on public.saved_moments;
create policy "saved_moments_owner_update"
  on public.saved_moments
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "saved_moments_owner_delete" on public.saved_moments;
create policy "saved_moments_owner_delete"
  on public.saved_moments
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "favorites_owner_read" on public.favorites;
create policy "favorites_owner_read"
  on public.favorites
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "favorites_owner_insert" on public.favorites;
create policy "favorites_owner_insert"
  on public.favorites
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "favorites_owner_delete" on public.favorites;
create policy "favorites_owner_delete"
  on public.favorites
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "blog_posts_owner_read" on public.blog_posts;
create policy "blog_posts_owner_read"
  on public.blog_posts
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "blog_posts_owner_insert" on public.blog_posts;
create policy "blog_posts_owner_insert"
  on public.blog_posts
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "blog_posts_owner_update" on public.blog_posts;
create policy "blog_posts_owner_update"
  on public.blog_posts
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "blog_posts_owner_delete" on public.blog_posts;
create policy "blog_posts_owner_delete"
  on public.blog_posts
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "user_settings_owner_read" on public.user_settings;
create policy "user_settings_owner_read"
  on public.user_settings
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "user_settings_owner_insert" on public.user_settings;
create policy "user_settings_owner_insert"
  on public.user_settings
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "user_settings_owner_update" on public.user_settings;
create policy "user_settings_owner_update"
  on public.user_settings
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "user_settings_owner_delete" on public.user_settings;
create policy "user_settings_owner_delete"
  on public.user_settings
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "thought_memory_owner_read" on public.thought_memory;
create policy "thought_memory_owner_read"
  on public.thought_memory
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "thought_memory_owner_insert" on public.thought_memory;
create policy "thought_memory_owner_insert"
  on public.thought_memory
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "thought_memory_owner_update" on public.thought_memory;
create policy "thought_memory_owner_update"
  on public.thought_memory
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "thought_memory_owner_delete" on public.thought_memory;
create policy "thought_memory_owner_delete"
  on public.thought_memory
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "interior_chat_authenticated_read" on public.interior_chat_messages;
create policy "interior_chat_authenticated_read"
  on public.interior_chat_messages
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "interior_chat_owner_insert" on public.interior_chat_messages;
create policy "interior_chat_owner_insert"
  on public.interior_chat_messages
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "interior_chat_owner_update" on public.interior_chat_messages;
create policy "interior_chat_owner_update"
  on public.interior_chat_messages
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "interior_chat_owner_delete" on public.interior_chat_messages;
create policy "interior_chat_owner_delete"
  on public.interior_chat_messages
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "pseudonym_follows_owner_read" on public.pseudonym_follows;
create policy "pseudonym_follows_owner_read"
  on public.pseudonym_follows
  for select
  using (follower_user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "pseudonym_follows_owner_insert" on public.pseudonym_follows;
create policy "pseudonym_follows_owner_insert"
  on public.pseudonym_follows
  for insert
  with check (follower_user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "pseudonym_follows_owner_delete" on public.pseudonym_follows;
create policy "pseudonym_follows_owner_delete"
  on public.pseudonym_follows
  for delete
  using (follower_user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "collections_owner_read" on public.collections;
create policy "collections_owner_read"
  on public.collections
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "collections_owner_insert" on public.collections;
create policy "collections_owner_insert"
  on public.collections
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "collections_owner_update" on public.collections;
create policy "collections_owner_update"
  on public.collections
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "collections_owner_delete" on public.collections;
create policy "collections_owner_delete"
  on public.collections
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "concepts_public_read_promoted" on public.concepts;
create policy "concepts_public_read_promoted"
  on public.concepts
  for select
  using (stage in ('resolved', 'canonical'));

drop policy if exists "concepts_owner_read" on public.concepts;
create policy "concepts_owner_read"
  on public.concepts
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "concepts_owner_insert" on public.concepts;
create policy "concepts_owner_insert"
  on public.concepts
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "concepts_owner_update" on public.concepts;
create policy "concepts_owner_update"
  on public.concepts
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "concepts_owner_delete" on public.concepts;
create policy "concepts_owner_delete"
  on public.concepts
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "concept_artifacts_public_read_promoted" on public.concept_artifacts;
create policy "concept_artifacts_public_read_promoted"
  on public.concept_artifacts
  for select
  using (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.stage in ('resolved', 'canonical')
    )
  );

drop policy if exists "concept_artifacts_owner_read" on public.concept_artifacts;
create policy "concept_artifacts_owner_read"
  on public.concept_artifacts
  for select
  using (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

drop policy if exists "concept_artifacts_owner_insert" on public.concept_artifacts;
create policy "concept_artifacts_owner_insert"
  on public.concept_artifacts
  for insert
  with check (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

drop policy if exists "concept_artifacts_owner_update" on public.concept_artifacts;
create policy "concept_artifacts_owner_update"
  on public.concept_artifacts
  for update
  using (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  )
  with check (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

drop policy if exists "concept_artifacts_owner_delete" on public.concept_artifacts;
create policy "concept_artifacts_owner_delete"
  on public.concept_artifacts
  for delete
  using (
    exists (
      select 1
      from public.concepts
      where public.concepts.id = concept_artifacts.concept_id
        and public.concepts.user_id = coalesce(auth.jwt() ->> 'sub', '')
    )
  );

drop policy if exists "engine_debug_runs_owner_read" on public.engine_debug_runs;
create policy "engine_debug_runs_owner_read"
  on public.engine_debug_runs
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "engine_debug_runs_owner_insert" on public.engine_debug_runs;
create policy "engine_debug_runs_owner_insert"
  on public.engine_debug_runs
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "engine_debug_runs_owner_delete" on public.engine_debug_runs;
create policy "engine_debug_runs_owner_delete"
  on public.engine_debug_runs
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_memory_states_owner_read" on public.mindslice_memory_states;
create policy "mindslice_memory_states_owner_read"
  on public.mindslice_memory_states
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_memory_states_owner_insert" on public.mindslice_memory_states;
create policy "mindslice_memory_states_owner_insert"
  on public.mindslice_memory_states
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_memory_states_owner_update" on public.mindslice_memory_states;
create policy "mindslice_memory_states_owner_update"
  on public.mindslice_memory_states
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_memory_states_owner_delete" on public.mindslice_memory_states;
create policy "mindslice_memory_states_owner_delete"
  on public.mindslice_memory_states
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_canon_states_owner_read" on public.mindslice_canon_states;
create policy "mindslice_canon_states_owner_read"
  on public.mindslice_canon_states
  for select
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_canon_states_owner_insert" on public.mindslice_canon_states;
create policy "mindslice_canon_states_owner_insert"
  on public.mindslice_canon_states
  for insert
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_canon_states_owner_update" on public.mindslice_canon_states;
create policy "mindslice_canon_states_owner_update"
  on public.mindslice_canon_states
  for update
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', ''));

drop policy if exists "mindslice_canon_states_owner_delete" on public.mindslice_canon_states;
create policy "mindslice_canon_states_owner_delete"
  on public.mindslice_canon_states
  for delete
  using (user_id = coalesce(auth.jwt() ->> 'sub', ''));
