alter table public.movies add column if not exists videos jsonb not null default '[]'::jsonb;
alter table public.series add column if not exists videos jsonb not null default '[]'::jsonb;
