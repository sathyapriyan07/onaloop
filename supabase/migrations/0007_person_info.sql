alter table public.people
  add column if not exists birthday date,
  add column if not exists place_of_birth text,
  add column if not exists known_for_department text;
