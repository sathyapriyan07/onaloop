-- Add category to platforms: 'ott' | 'music' (default 'ott')
alter table public.platforms
  add column if not exists category text not null default 'ott'
  check (category in ('ott', 'music'));
