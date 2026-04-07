import { env } from './env'

const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p'

export type TmdbType = 'movie' | 'series' | 'person'

export type TmdbSearchResult = {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  profile_path?: string | null
}

async function get(path: string, params: Record<string, string> = {}) {
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', env.tmdbApiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`TMDb error (${res.status})`)
  return res.json()
}

function imageUrls(items: any[] | undefined, size: string): string[] {
  return (items ?? [])
    .map((i) => i?.file_path ? `${IMG}/${size}${i.file_path}` : null)
    .filter((x): x is string => !!x)
}

export async function tmdbSearch(type: TmdbType, query: string): Promise<TmdbSearchResult[]> {
  const endpoint = type === 'movie' ? '/search/movie' : type === 'series' ? '/search/tv' : '/search/person'
  const data = await get(endpoint, { query, include_adult: 'false' })
  return data?.results ?? []
}

export async function tmdbFetchMovie(tmdbId: number) {
  const data = await get(`/movie/${tmdbId}`, {
    append_to_response: 'images',
    include_image_language: 'en,null',
  })
  return {
    tmdb_id: tmdbId,
    title: data?.title ?? '',
    overview: data?.overview ?? null,
    release_date: data?.release_date || null,
    runtime_minutes: data?.runtime ?? null,
    poster_images: imageUrls(data?.images?.posters, 'w780'),
    backdrop_images: imageUrls(data?.images?.backdrops, 'w1280'),
    title_logos: imageUrls(data?.images?.logos, 'w500'),
    genres: (data?.genres ?? []) as Array<{ id: number; name: string }>,
  }
}

export async function tmdbFetchSeries(tmdbId: number) {
  const data = await get(`/tv/${tmdbId}`, {
    append_to_response: 'images',
    include_image_language: 'en,null',
  })
  return {
    tmdb_id: tmdbId,
    title: data?.name ?? '',
    overview: data?.overview ?? null,
    first_air_date: data?.first_air_date || null,
    poster_images: imageUrls(data?.images?.posters, 'w780'),
    backdrop_images: imageUrls(data?.images?.backdrops, 'w1280'),
    title_logos: imageUrls(data?.images?.logos, 'w500'),
    genres: (data?.genres ?? []) as Array<{ id: number; name: string }>,
  }
}

export async function tmdbFetchPerson(tmdbId: number) {
  const data = await get(`/person/${tmdbId}`, { append_to_response: 'images' })
  return {
    tmdb_id: tmdbId,
    name: data?.name ?? '',
    bio: data?.biography ?? null,
    profile_images: imageUrls(data?.images?.profiles, 'w500'),
  }
}
