import { useMemo, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { supabase } from '../../../lib/supabase'
import {
  tmdbSearch,
  tmdbFetchMovie,
  tmdbFetchSeries,
  tmdbFetchPerson,
  type TmdbType,
  type TmdbSearchResult,
  type TmdbCredit,
} from '../../../lib/tmdb'

async function upsertCredits(credits: TmdbCredit[], parentKey: 'movie_id' | 'series_id', parentId: string) {
  await supabase.from('credits').delete().eq(parentKey, parentId)
  if (!credits.length) return
  for (const c of credits) {
    const profileUrls = c.profile_path ? [`https://image.tmdb.org/t/p/w500${c.profile_path}`] : []
    const { data: person, error: pErr } = await supabase
      .from('people')
      .upsert(
        { tmdb_id: c.tmdb_id, name: c.name, profile_images: profileUrls, selected_profile_url: profileUrls[0] ?? null },
        { onConflict: 'tmdb_id' },
      )
      .select('id')
      .single()
    if (pErr) throw new Error(pErr.message)
    const { error: cErr } = await supabase.from('credits').insert({
      person_id: person.id,
      [parentKey]: parentId,
      credit_type: c.credit_type,
      character: c.character ?? null,
      job: c.job ?? null,
      sort_order: c.sort_order,
    })
    if (cErr) throw new Error(cErr.message)
  }
}

async function upsertGenres(genres: Array<{ id: number; name: string }>) {
  const ids: string[] = []
  for (const g of genres) {
    const { data, error } = await supabase
      .from('genres')
      .upsert({ tmdb_id: g.id, name: g.name }, { onConflict: 'tmdb_id' })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    ids.push(data.id)
  }
  return ids
}

async function importMovie(tmdbId: number) {
  const movie = await tmdbFetchMovie(tmdbId)
  const { genres, credits, ...payload } = movie
  const posterUrls = payload.poster_images
  const backdropUrls = payload.backdrop_images
  const logoUrls = payload.title_logos

  const { data: row, error } = await supabase
    .from('movies')
    .upsert(
      {
        ...payload,
        selected_poster_url: posterUrls[0] ?? null,
        selected_backdrop_url: backdropUrls[0] ?? null,
        selected_logo_url: logoUrls[0] ?? null,
      },
      { onConflict: 'tmdb_id' },
    )
    .select('id,title')
    .single()
  if (error) throw new Error(error.message)

  const genreIds = await upsertGenres(genres)
  await supabase.from('movie_genres').delete().eq('movie_id', row.id)
  if (genreIds.length) {
    const { error: mgError } = await supabase
      .from('movie_genres')
      .insert(genreIds.map((genre_id) => ({ movie_id: row.id, genre_id })))
    if (mgError) throw new Error(mgError.message)
  }
  await upsertCredits(credits, 'movie_id', row.id)
  return row.title
}

async function importSeries(tmdbId: number) {
  const series = await tmdbFetchSeries(tmdbId)
  const { genres, credits, ...payload } = series
  const posterUrls = payload.poster_images
  const backdropUrls = payload.backdrop_images
  const logoUrls = payload.title_logos

  const { data: row, error } = await supabase
    .from('series')
    .upsert(
      {
        ...payload,
        selected_poster_url: posterUrls[0] ?? null,
        selected_backdrop_url: backdropUrls[0] ?? null,
        selected_logo_url: logoUrls[0] ?? null,
      },
      { onConflict: 'tmdb_id' },
    )
    .select('id,title')
    .single()
  if (error) throw new Error(error.message)

  const genreIds = await upsertGenres(genres)
  await supabase.from('series_genres').delete().eq('series_id', row.id)
  if (genreIds.length) {
    const { error: sgError } = await supabase
      .from('series_genres')
      .insert(genreIds.map((genre_id) => ({ series_id: row.id, genre_id })))
    if (sgError) throw new Error(sgError.message)
  }
  await upsertCredits(credits, 'series_id', row.id)
  return row.title
}

async function importPerson(tmdbId: number) {
  const person = await tmdbFetchPerson(tmdbId)
  const profileUrls = person.profile_images
  const { data: row, error } = await supabase
    .from('people')
    .upsert(
      { ...person, selected_profile_url: profileUrls[0] ?? null },
      { onConflict: 'tmdb_id' },
    )
    .select('id,name')
    .single()
  if (error) throw new Error(error.message)
  return row.name
}

export default function AdminImportPage() {
  const [type, setType] = useState<TmdbType>('movie')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)

  const title = useMemo(
    () => (type === 'movie' ? 'Movies' : type === 'series' ? 'Series' : 'People'),
    [type],
  )

  async function search() {
    setError(null)
    setIsLoading(true)
    try {
      setResults(await tmdbSearch(type, query.trim()))
    } catch (e: any) {
      setError(e?.message ?? 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  async function doImport(tmdbId: number) {
    setError(null)
    setImportingId(tmdbId)
    try {
      const name =
        type === 'movie'
          ? await importMovie(tmdbId)
          : type === 'series'
            ? await importSeries(tmdbId)
            : await importPerson(tmdbId)
      alert(`Imported: ${name}`)
    } catch (e: any) {
      setError(e?.message ?? 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">TMDb Import</h1>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap gap-2">
          {(['movie', 'series', 'person'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={[
                'rounded-xl border px-3 py-2 text-xs',
                t === type ? 'border-white bg-white text-neutral-950' : 'border-white/10 bg-white/5 text-white/80',
              ].join(' ')}
            >
              {t === 'movie' ? 'Movies' : t === 'series' ? 'Series' : 'People'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title}…`} />
          <Button disabled={isLoading || !query.trim()} onClick={search} className="shrink-0">
            Search
          </Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <div key={r.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">{r.title ?? r.name ?? `#${r.id}`}</div>
            {r.overview ? <p className="mt-2 line-clamp-3 text-xs text-white/60">{r.overview}</p> : null}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-white/50">TMDb #{r.id}</div>
              <Button disabled={importingId === r.id} onClick={() => doImport(r.id)}>
                {importingId === r.id ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!results.length ? <div className="text-sm text-white/60">Search TMDb to import content.</div> : null}
    </div>
  )
}
