-- Add IMDb and Rotten Tomatoes rating fields to movies table

alter table public.movies add column if not exists imdb_rating numeric(3,1);
alter table public.movies add column if not exists rotten_tomatoes_rating integer;

-- Add constraints
alter table public.movies add constraint movies_imdb_rating_check check (imdb_rating >= 0 and imdb_rating <= 10);
alter table public.movies add constraint movies_rotten_tomatoes_rating_check check (rotten_tomatoes_rating >= 0 and rotten_tomatoes_rating <= 100);