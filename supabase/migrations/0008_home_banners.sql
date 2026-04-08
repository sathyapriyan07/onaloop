create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint home_banners_one_parent check ((movie_id is not null) <> (series_id is not null))
);

alter table public.home_banners enable row level security;

create policy "home_banners_public_read" on public.home_banners for select using (true);
create policy "home_banners_admin_all" on public.home_banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
