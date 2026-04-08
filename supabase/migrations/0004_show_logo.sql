alter table public.movies add column if not exists show_logo boolean not null default true;
alter table public.series add column if not exists show_logo boolean not null default true;
