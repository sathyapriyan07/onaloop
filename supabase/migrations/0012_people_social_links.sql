alter table public.people
  add column if not exists social_links jsonb not null default '[]'::jsonb;
