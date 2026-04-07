# OnTheLoop

Admin-controlled movie/series discovery platform (IMDb + TMDb vibes) with an OTT-style, mobile-first UI.

## Tech

- Frontend: React + Vite
- Backend: Supabase (DB + Auth + Storage)
- Import: TMDb (via Supabase Edge Functions)

## Quick start (frontend)

1. Create `.env` from `.env.example`
2. Run:
   - `npm install`
   - `npm run dev`

## Supabase setup

### 1) Apply DB schema

Run the migration in `supabase/migrations/0001_init.sql` using either:

- Supabase SQL editor (paste + run), or
- Supabase CLI migrations (recommended if you already use the CLI).

### 2) Create the first admin (bootstrap)

Admins are managed in the `public.admins` table (no self-upgrade).

After you create a Supabase Auth user, insert their `auth.users.id` into `public.admins` using **service role** or the SQL editor:

```sql
insert into public.admins (user_id) values ('<AUTH_USER_UUID>');
```

### 3) Set Edge Function secrets

Set the TMDb key in Supabase secrets:

- `TMDB_API_KEY`

### 4) Deploy Edge Functions

Deploy:

- `supabase/functions/tmdb-search`
- `supabase/functions/tmdb-import`

Both functions require a valid logged-in admin session (they verify the JWT + `public.admins` membership).

## App routes

- User: `/`, `/movies`, `/series`, `/movie/:id`, `/series/:id`, `/person/:id`, `/genres`, `/platforms`, `/search`
- Auth: `/login`, `/signup`
- Admin: `/admin/login`, `/admin`, `/admin/import`, `/admin/home`

## Notes

- Content is imported and curated only by admins (no public content creation).
- Reviews are user-generated; users can manage their own reviews; admins can moderate/delete.

