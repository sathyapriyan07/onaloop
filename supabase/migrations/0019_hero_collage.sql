create table if not exists public.hero_collage (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid references public.movies(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.hero_collage enable row level security;
create policy "hero_collage_public_read" on public.hero_collage for select using (true);
create policy "hero_collage_admin_all" on public.hero_collage for all to authenticated using (public.is_admin()) with check (public.is_admin());
