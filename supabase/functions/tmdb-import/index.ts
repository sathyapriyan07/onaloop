import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/admin.ts'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function asImageUrl(path: string | null | undefined, size: string) {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

function listUrls(items: any[] | undefined, size: string) {
  return (items ?? [])
    .map((i) => asImageUrl(i?.file_path, size))
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
}

type Body = { type: 'movie' | 'series' | 'person'; tmdbId: number }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const admin = await requireAdmin(req)
  if (!admin.ok)
    return new Response(JSON.stringify({ error: admin.error }), {
      status: admin.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const type = body.type
  const tmdbId = Number(body.tmdbId)
  if (!Number.isFinite(tmdbId) || tmdbId <= 0)
    return new Response(JSON.stringify({ error: 'Invalid tmdbId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const apiKey = requiredEnv('TMDB_API_KEY')

  async function fetchTmdb(path: string, params: Record<string, string> = {}) {
    const url = new URL(TMDB_BASE_URL + path)
    url.searchParams.set('api_key', apiKey)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`TMDb error (${res.status}): ${text.slice(0, 500)}`)
    }
    return (await res.json()) as any
  }

  try {
    if (type === 'movie') {
      const movie = await fetchTmdb(`/movie/${tmdbId}`, {
        append_to_response: 'images',
        include_image_language: 'en,null',
      })

      const posterUrls = listUrls(movie?.images?.posters, 'w780')
      const backdropUrls = listUrls(movie?.images?.backdrops, 'w1280')
      const logoUrls = listUrls(movie?.images?.logos, 'w500')

      const upsertPayload = {
        tmdb_id: tmdbId,
        title: movie?.title ?? '',
        overview: movie?.overview ?? null,
        release_date: movie?.release_date || null,
        runtime_minutes: movie?.runtime ?? null,
        poster_images: posterUrls,
        backdrop_images: backdropUrls,
        title_logos: logoUrls,
        selected_poster_url: posterUrls[0] ?? null,
        selected_backdrop_url: backdropUrls[0] ?? null,
        selected_logo_url: logoUrls[0] ?? null,
      }

      const { data: movieRow, error: movieError } = await admin.supabase
        .from('movies')
        .upsert(upsertPayload, { onConflict: 'tmdb_id' })
        .select('id,title')
        .single()
      if (movieError) throw new Error(movieError.message)

      const genreIds: string[] = []
      for (const g of (movie?.genres ?? []) as Array<{ id: number; name: string }>) {
        const { data: genreRow, error: genreError } = await admin.supabase
          .from('genres')
          .upsert({ tmdb_id: g.id, name: g.name }, { onConflict: 'tmdb_id' })
          .select('id')
          .single()
        if (genreError) throw new Error(genreError.message)
        genreIds.push(genreRow.id)
      }

      await admin.supabase.from('movie_genres').delete().eq('movie_id', movieRow.id)
      if (genreIds.length) {
        const rows = genreIds.map((genreId) => ({ movie_id: movieRow.id, genre_id: genreId }))
        const { error: mgError } = await admin.supabase.from('movie_genres').insert(rows)
        if (mgError) throw new Error(mgError.message)
      }

      return new Response(JSON.stringify({ id: movieRow.id, title: movieRow.title }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (type === 'series') {
      const tv = await fetchTmdb(`/tv/${tmdbId}`, {
        append_to_response: 'images',
        include_image_language: 'en,null',
      })

      const posterUrls = listUrls(tv?.images?.posters, 'w780')
      const backdropUrls = listUrls(tv?.images?.backdrops, 'w1280')
      const logoUrls = listUrls(tv?.images?.logos, 'w500')

      const upsertPayload = {
        tmdb_id: tmdbId,
        title: tv?.name ?? '',
        overview: tv?.overview ?? null,
        first_air_date: tv?.first_air_date || null,
        poster_images: posterUrls,
        backdrop_images: backdropUrls,
        title_logos: logoUrls,
        selected_poster_url: posterUrls[0] ?? null,
        selected_backdrop_url: backdropUrls[0] ?? null,
        selected_logo_url: logoUrls[0] ?? null,
      }

      const { data: seriesRow, error: seriesError } = await admin.supabase
        .from('series')
        .upsert(upsertPayload, { onConflict: 'tmdb_id' })
        .select('id,title')
        .single()
      if (seriesError) throw new Error(seriesError.message)

      const genreIds: string[] = []
      for (const g of (tv?.genres ?? []) as Array<{ id: number; name: string }>) {
        const { data: genreRow, error: genreError } = await admin.supabase
          .from('genres')
          .upsert({ tmdb_id: g.id, name: g.name }, { onConflict: 'tmdb_id' })
          .select('id')
          .single()
        if (genreError) throw new Error(genreError.message)
        genreIds.push(genreRow.id)
      }

      await admin.supabase.from('series_genres').delete().eq('series_id', seriesRow.id)
      if (genreIds.length) {
        const rows = genreIds.map((genreId) => ({ series_id: seriesRow.id, genre_id: genreId }))
        const { error: sgError } = await admin.supabase.from('series_genres').insert(rows)
        if (sgError) throw new Error(sgError.message)
      }

      return new Response(JSON.stringify({ id: seriesRow.id, title: seriesRow.title }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (type === 'person') {
      const person = await fetchTmdb(`/person/${tmdbId}`, { append_to_response: 'images' })
      const profileUrls = listUrls(person?.images?.profiles, 'w500')

      const upsertPayload = {
        tmdb_id: tmdbId,
        name: person?.name ?? '',
        bio: person?.biography ?? null,
        profile_images: profileUrls,
        selected_profile_url: profileUrls[0] ?? null,
      }

      const { data: personRow, error: personError } = await admin.supabase
        .from('people')
        .upsert(upsertPayload, { onConflict: 'tmdb_id' })
        .select('id,name')
        .single()
      if (personError) throw new Error(personError.message)

      return new Response(JSON.stringify({ id: personRow.id, name: personRow.name }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Import failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

