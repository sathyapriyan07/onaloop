create table if not exists public.production_houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  display_image_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.movie_production_houses (
  movie_id uuid not null references public.movies(id) on delete cascade,
  production_house_id uuid not null references public.production_houses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (movie_id, production_house_id)
);

drop trigger if exists production_houses_updated_at on public.production_houses;
create trigger production_houses_updated_at before update on public.production_houses for each row execute function public.set_updated_at();

alter table public.production_houses enable row level security;
alter table public.movie_production_houses enable row level security;

create policy "production_houses_public_read" on public.production_houses for select using (true);
create policy "movie_production_houses_public_read" on public.movie_production_houses for select using (true);
create policy "production_houses_admin_all" on public.production_houses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movie_production_houses_admin_all" on public.movie_production_houses for all to authenticated using (public.is_admin()) with check (public.is_admin());
