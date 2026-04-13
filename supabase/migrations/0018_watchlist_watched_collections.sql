-- Watchlist
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint watchlist_one_parent check ((movie_id is not null) <> (series_id is not null))
);
create unique index if not exists watchlist_user_movie on public.watchlist (user_id, movie_id) where movie_id is not null;
create unique index if not exists watchlist_user_series on public.watchlist (user_id, series_id) where series_id is not null;
alter table public.watchlist enable row level security;
create policy "watchlist_user_all" on public.watchlist for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watchlist_public_read" on public.watchlist for select using (true);

-- Watched
create table if not exists public.watched (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint watched_one_parent check ((movie_id is not null) <> (series_id is not null))
);
create unique index if not exists watched_user_movie on public.watched (user_id, movie_id) where movie_id is not null;
create unique index if not exists watched_user_series on public.watched (user_id, series_id) where series_id is not null;
alter table public.watched enable row level security;
create policy "watched_user_all" on public.watched for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watched_public_read" on public.watched for select using (true);

-- Collections / Franchises
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.collections enable row level security;
create policy "collections_public_read" on public.collections for select using (true);
create policy "collections_admin_all" on public.collections for all to authenticated using (public.is_admin()) with check (public.is_admin());

create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint collection_items_one_parent check ((movie_id is not null) <> (series_id is not null))
);
alter table public.collection_items enable row level security;
create policy "collection_items_public_read" on public.collection_items for select using (true);
create policy "collection_items_admin_all" on public.collection_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Loop score on movies
alter table public.movies add column if not exists loop_score numeric(3,1);
-- Loop score on series
alter table public.series add column if not exists loop_score numeric(3,1);
