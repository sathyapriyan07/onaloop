-- Music links for series (mirrors movie_music_links)
create table if not exists public.series_music_links (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  platform_id uuid references public.platforms(id),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.series_music_links enable row level security;
create policy "series_music_links_public_read" on public.series_music_links for select using (true);
create policy "series_music_links_admin_all" on public.series_music_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
