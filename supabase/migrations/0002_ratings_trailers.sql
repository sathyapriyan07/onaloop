alter table public.movies
  add column if not exists tmdb_rating numeric(3,1),
  add column if not exists trailer_url text;

alter table public.series
  add column if not exists tmdb_rating numeric(3,1),
  add column if not exists trailer_url text;
