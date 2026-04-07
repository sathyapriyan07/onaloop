-- Core schema for OnTheLoop (admin-controlled discovery + reviews)

create extension if not exists "pgcrypto";

-- Helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- Only admins can read/manage admin list (bootstrap first admin via service role or SQL editor).
create policy "admins_select_admin" on public.admins
for select to authenticated
using (public.is_admin());

create policy "admins_insert_admin" on public.admins
for insert to authenticated
with check (public.is_admin());

create policy "admins_delete_admin" on public.admins
for delete to authenticated
using (public.is_admin());

-- Taxonomy
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  name text not null,
  display_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  display_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Content
create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  title text not null,
  overview text,
  release_date date,
  runtime_minutes integer,
  poster_images jsonb not null default '[]'::jsonb,
  backdrop_images jsonb not null default '[]'::jsonb,
  title_logos jsonb not null default '[]'::jsonb,
  selected_poster_url text,
  selected_backdrop_url text,
  selected_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  title text not null,
  overview text,
  first_air_date date,
  poster_images jsonb not null default '[]'::jsonb,
  backdrop_images jsonb not null default '[]'::jsonb,
  title_logos jsonb not null default '[]'::jsonb,
  selected_poster_url text,
  selected_backdrop_url text,
  selected_logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique,
  name text not null,
  bio text,
  profile_images jsonb not null default '[]'::jsonb,
  selected_profile_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Relations
create table if not exists public.movie_genres (
  movie_id uuid not null references public.movies(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (movie_id, genre_id)
);

create table if not exists public.series_genres (
  series_id uuid not null references public.series(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (series_id, genre_id)
);

create table if not exists public.movie_platforms (
  movie_id uuid not null references public.movies(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (movie_id, platform_id)
);

create table if not exists public.series_platforms (
  series_id uuid not null references public.series(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (series_id, platform_id)
);

create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  credit_type text not null default 'cast' check (credit_type in ('cast','crew')),
  role text,
  "character" text,
  job text,
  sort_order integer,
  created_at timestamptz not null default now(),
  constraint credits_one_parent check ((movie_id is not null) <> (series_id is not null))
);

-- Links (admin-controlled)
create table if not exists public.movie_music_links (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  platform_id uuid references public.platforms(id),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.movie_streaming_links (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  platform_id uuid references public.platforms(id),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.series_streaming_links (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.series(id) on delete cascade,
  platform_id uuid references public.platforms(id),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Homepage curation (admin-controlled)
create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  kind text not null default 'custom',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.home_sections(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint home_items_one_parent check ((movie_id is not null) <> (series_id is not null))
);

-- Reviews (user-generated only)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete cascade,
  series_id uuid references public.series(id) on delete cascade,
  rating smallint,
  review_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_parent check ((movie_id is not null) <> (series_id is not null))
);

create unique index if not exists reviews_user_movie_unique on public.reviews (user_id, movie_id) where movie_id is not null;
create unique index if not exists reviews_user_series_unique on public.reviews (user_id, series_id) where series_id is not null;

-- updated_at triggers
drop trigger if exists genres_updated_at on public.genres;
create trigger genres_updated_at before update on public.genres for each row execute function public.set_updated_at();
drop trigger if exists platforms_updated_at on public.platforms;
create trigger platforms_updated_at before update on public.platforms for each row execute function public.set_updated_at();
drop trigger if exists movies_updated_at on public.movies;
create trigger movies_updated_at before update on public.movies for each row execute function public.set_updated_at();
drop trigger if exists series_updated_at on public.series;
create trigger series_updated_at before update on public.series for each row execute function public.set_updated_at();
drop trigger if exists people_updated_at on public.people;
create trigger people_updated_at before update on public.people for each row execute function public.set_updated_at();
drop trigger if exists home_sections_updated_at on public.home_sections;
create trigger home_sections_updated_at before update on public.home_sections for each row execute function public.set_updated_at();
drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at before update on public.reviews for each row execute function public.set_updated_at();

-- RLS
alter table public.genres enable row level security;
alter table public.platforms enable row level security;
alter table public.movies enable row level security;
alter table public.series enable row level security;
alter table public.people enable row level security;
alter table public.movie_genres enable row level security;
alter table public.series_genres enable row level security;
alter table public.movie_platforms enable row level security;
alter table public.series_platforms enable row level security;
alter table public.credits enable row level security;
alter table public.movie_music_links enable row level security;
alter table public.movie_streaming_links enable row level security;
alter table public.series_streaming_links enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_section_items enable row level security;
alter table public.reviews enable row level security;

-- Public read policies (anonymous + authenticated)
create policy "genres_public_read" on public.genres for select using (true);
create policy "platforms_public_read" on public.platforms for select using (true);
create policy "movies_public_read" on public.movies for select using (true);
create policy "series_public_read" on public.series for select using (true);
create policy "people_public_read" on public.people for select using (true);
create policy "movie_genres_public_read" on public.movie_genres for select using (true);
create policy "series_genres_public_read" on public.series_genres for select using (true);
create policy "movie_platforms_public_read" on public.movie_platforms for select using (true);
create policy "series_platforms_public_read" on public.series_platforms for select using (true);
create policy "credits_public_read" on public.credits for select using (true);
create policy "movie_music_links_public_read" on public.movie_music_links for select using (true);
create policy "movie_streaming_links_public_read" on public.movie_streaming_links for select using (true);
create policy "series_streaming_links_public_read" on public.series_streaming_links for select using (true);
create policy "home_sections_public_read" on public.home_sections for select using (true);
create policy "home_section_items_public_read" on public.home_section_items for select using (true);
create policy "reviews_public_read" on public.reviews for select using (true);

-- Admin full access (authenticated admins only)
create policy "genres_admin_all" on public.genres for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "platforms_admin_all" on public.platforms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movies_admin_all" on public.movies for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "series_admin_all" on public.series for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "people_admin_all" on public.people for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movie_genres_admin_all" on public.movie_genres for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "series_genres_admin_all" on public.series_genres for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movie_platforms_admin_all" on public.movie_platforms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "series_platforms_admin_all" on public.series_platforms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "credits_admin_all" on public.credits for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movie_music_links_admin_all" on public.movie_music_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "movie_streaming_links_admin_all" on public.movie_streaming_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "series_streaming_links_admin_all" on public.series_streaming_links for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "home_sections_admin_all" on public.home_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "home_section_items_admin_all" on public.home_section_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reviews_admin_delete" on public.reviews for delete to authenticated using (public.is_admin());

-- Users can manage their own reviews (but cannot create content)
create policy "reviews_user_insert" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews_user_update" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reviews_user_delete" on public.reviews for delete to authenticated using (auth.uid() = user_id);

