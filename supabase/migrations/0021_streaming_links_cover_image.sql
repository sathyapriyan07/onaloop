alter table public.movie_streaming_links add column if not exists cover_image_url text;
alter table public.series_streaming_links add column if not exists cover_image_url text;
