-- Add gallery_images field to movies table for additional movie stills/screenshots

alter table public.movies add column if not exists gallery_images jsonb not null default '[]'::jsonb;