alter table public.movies
  add column if not exists tags text[] not null default '{}';
