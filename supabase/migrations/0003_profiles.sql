create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_public_read" on public.profiles for select using (true);

create policy "profiles_user_update" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- backfill existing users
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
