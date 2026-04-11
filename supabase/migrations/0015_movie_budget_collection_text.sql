-- Drop bigint columns and replace with text so admin can enter "30 Cr", "45 Lakhs" etc.
alter table public.movies
  drop column if exists budget,
  drop column if exists collection;

alter table public.movies
  add column if not exists budget text,
  add column if not exists collection text;
