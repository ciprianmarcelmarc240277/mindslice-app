alter table public.author_identities
  add column if not exists middle_name text;

alter table public.author_identities
  add column if not exists executive_name text;

alter table public.author_identities
  add column if not exists executive_index text;
