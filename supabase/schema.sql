create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id text primary key,
  display_name text,
  pseudonym text,
  email text,
  avatar_url text,
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
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id text primary key references public.profiles(user_id) on delete cascade,
  language text not null default 'ro',
  autoplay_enabled boolean not null default true,
  preferred_view text not null default 'gallery',
  show_blog boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists collections_user_id_created_at_idx
  on public.collections (user_id, created_at desc);
