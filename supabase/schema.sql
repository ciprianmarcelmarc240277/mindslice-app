create extension if not exists "pgcrypto";

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
  content text not null,
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
