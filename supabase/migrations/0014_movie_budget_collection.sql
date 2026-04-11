alter table public.movies
  add column if not exists budget bigint,
  add column if not exists collection bigint;
