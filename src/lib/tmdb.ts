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

export type TmdbCredit = {
  tmdb_id: number
  name: string
  profile_path: string | null
  credit_type: 'cast' | 'crew'
  character?: string
  job?: string
  sort_order: number
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
    .map((i) => (i?.file_path ? `${IMG}/${size}${i.file_path}` : null))
    .filter((x): x is string => !!x)
}

export type TmdbVideo = {
  key: string
  name: string
  type: string
  site: string
}

function extractTrailer(videos: any): string | null {
  const results: any[] = videos?.results ?? []
  const trailer =
    results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
    results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
}

function extractCredits(data: any): TmdbCredit[] {
  const cast: TmdbCredit[] = (data?.cast ?? []).slice(0, 50).map((c: any, i: number) => ({
    tmdb_id: c.id,
    name: c.name ?? '',
    profile_path: c.profile_path ?? null,
    credit_type: 'cast' as const,
    character: c.character ?? undefined,
    sort_order: i,
  }))
  const crew: TmdbCredit[] = (data?.crew ?? [])
    .filter((c: any) => ['Director', 'Producer', 'Screenplay', 'Writer', 'Story'].includes(c.job))
    .map((c: any, i: number) => ({
      tmdb_id: c.id,
      name: c.name ?? '',
      profile_path: c.profile_path ?? null,
      credit_type: 'crew' as const,
      job: c.job ?? undefined,
      sort_order: i,
    }))
  return [...cast, ...crew]
}

function extractVideos(videos: any): TmdbVideo[] {
  return (videos?.results ?? [])
    .filter((v: any) => v.site === 'YouTube')
    .map((v: any) => ({ key: v.key, name: v.name, type: v.type, site: v.site }))
}

export async function tmdbSearch(type: TmdbType, query: string): Promise<TmdbSearchResult[]> {
  const endpoint = type === 'movie' ? '/search/movie' : type === 'series' ? '/search/tv' : '/search/person'
  const data = await get(endpoint, { query, include_adult: 'false' })
  return data?.results ?? []
}

export async function tmdbFetchMovie(tmdbId: number) {
  const data = await get(`/movie/${tmdbId}`, {
    append_to_response: 'images,credits,videos',
    include_image_language: 'en,null',
  })
  return {
    tmdb_id: tmdbId,
    title: data?.title ?? '',
    overview: data?.overview ?? null,
    release_date: data?.release_date || null,
    runtime_minutes: data?.runtime ?? null,
    tmdb_rating: data?.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
    original_language: data?.original_language ?? null,
    poster_images: imageUrls(data?.images?.posters, 'w780'),
    backdrop_images: imageUrls(data?.images?.backdrops, 'w1280'),
    title_logos: imageUrls(data?.images?.logos, 'w500'),
    trailer_url: extractTrailer(data?.videos),
    videos: extractVideos(data?.videos),
    genres: (data?.genres ?? []) as Array<{ id: number; name: string }>,
    credits: extractCredits(data?.credits),
  }
}

export async function tmdbFetchSeries(tmdbId: number) {
  const data = await get(`/tv/${tmdbId}`, {
    append_to_response: 'images,credits,videos',
    include_image_language: 'en,null',
  })
  return {
    tmdb_id: tmdbId,
    title: data?.name ?? '',
    overview: data?.overview ?? null,
    first_air_date: data?.first_air_date || null,
    tmdb_rating: data?.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
    original_language: data?.original_language ?? null,
    poster_images: imageUrls(data?.images?.posters, 'w780'),
    backdrop_images: imageUrls(data?.images?.backdrops, 'w1280'),
    title_logos: imageUrls(data?.images?.logos, 'w500'),
    trailer_url: extractTrailer(data?.videos),
    videos: extractVideos(data?.videos),
    genres: (data?.genres ?? []) as Array<{ id: number; name: string }>,
    credits: extractCredits(data?.credits),
  }
}

export async function tmdbFetchPerson(tmdbId: number) {
  const data = await get(`/person/${tmdbId}`, { append_to_response: 'images' })
  return {
    tmdb_id: tmdbId,
    name: data?.name ?? '',
    bio: data?.biography ?? null,
    birthday: data?.birthday || null,
    place_of_birth: data?.place_of_birth ?? null,
    known_for_department: data?.known_for_department ?? null,
    profile_images: imageUrls(data?.images?.profiles, 'w500'),
  }
}
