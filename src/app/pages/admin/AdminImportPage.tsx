import { useEffect, useMemo, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import AdminBackButton from '../../ui/AdminBackButton'
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
  const tmdbIds = [...new Set(credits.map((c) => c.tmdb_id))]
  const { data: existing } = await supabase.from('people').select('tmdb_id').in('tmdb_id', tmdbIds)
  const existingIds = new Set((existing ?? []).map((r: any) => r.tmdb_id))
  const bioMap: Record<number, string | null> = {}
  await Promise.all(
    tmdbIds.filter((id) => !existingIds.has(id)).map(async (id) => {
      try { const p = await tmdbFetchPerson(id); bioMap[id] = p.bio } catch { bioMap[id] = null }
    })
  )
  for (const c of credits) {
    const profileUrls = c.profile_path ? [`https://image.tmdb.org/t/p/w500${c.profile_path}`] : []
    const { data: person, error: pErr } = await supabase.from('people')
      .upsert({ tmdb_id: c.tmdb_id, name: c.name, profile_images: profileUrls, selected_profile_url: profileUrls[0] ?? null, ...(c.tmdb_id in bioMap ? { bio: bioMap[c.tmdb_id] } : {}) }, { onConflict: 'tmdb_id' })
      .select('id').single()
    if (pErr) throw new Error(pErr.message)
    const { error: cErr } = await supabase.from('credits').insert({ person_id: person.id, [parentKey]: parentId, credit_type: c.credit_type, character: c.character ?? null, job: c.job ?? null, sort_order: c.sort_order })
    if (cErr) throw new Error(cErr.message)
  }
}

async function upsertGenres(genres: Array<{ id: number; name: string }>) {
  const ids: string[] = []
  for (const g of genres) {
    const { data, error } = await supabase.from('genres').upsert({ tmdb_id: g.id, name: g.name }, { onConflict: 'tmdb_id' }).select('id').single()
    if (error) throw new Error(error.message)
    ids.push(data.id)
  }
  return ids
}

async function importMovie(tmdbId: number) {
  const movie = await tmdbFetchMovie(tmdbId)
  const { genres, credits, ...payload } = movie
  const { data: row, error } = await supabase.from('movies')
    .upsert({ ...payload, selected_poster_url: payload.poster_images[0] ?? null, selected_backdrop_url: payload.backdrop_images[0] ?? null, selected_logo_url: payload.title_logos[0] ?? null }, { onConflict: 'tmdb_id' })
    .select('id,title').single()
  if (error) throw new Error(error.message)
  const genreIds = await upsertGenres(genres)
  await supabase.from('movie_genres').delete().eq('movie_id', row.id)
  if (genreIds.length) await supabase.from('movie_genres').insert(genreIds.map((genre_id) => ({ movie_id: row.id, genre_id })))
  await upsertCredits(credits, 'movie_id', row.id)
  return row.title
}

async function importSeries(tmdbId: number) {
  const series = await tmdbFetchSeries(tmdbId)
  const { genres, credits, ...payload } = series
  const { data: row, error } = await supabase.from('series')
    .upsert({ ...payload, selected_poster_url: payload.poster_images[0] ?? null, selected_backdrop_url: payload.backdrop_images[0] ?? null, selected_logo_url: payload.title_logos[0] ?? null }, { onConflict: 'tmdb_id' })
    .select('id,title').single()
  if (error) throw new Error(error.message)
  const genreIds = await upsertGenres(genres)
  await supabase.from('series_genres').delete().eq('series_id', row.id)
  if (genreIds.length) await supabase.from('series_genres').insert(genreIds.map((genre_id) => ({ series_id: row.id, genre_id })))
  await upsertCredits(credits, 'series_id', row.id)
  return row.title
}

async function importPerson(tmdbId: number) {
  const person = await tmdbFetchPerson(tmdbId)
  const { data: row, error } = await supabase.from('people')
    .upsert({ ...person, selected_profile_url: person.profile_images[0] ?? null }, { onConflict: 'tmdb_id' })
    .select('id,name').single()
  if (error) throw new Error(error.message)
  return row.name
}

type BulkStatus = { id: number; status: 'pending' | 'importing' | 'done' | 'error'; label: string; error?: string }

export default function AdminImportPage() {
  const [type, setType] = useState<TmdbType>('movie')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TmdbSearchResult[]>([])
  const [imported, setImported] = useState<Record<number, string>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)
  const [bulkStatus, setBulkStatus] = useState<BulkStatus[]>([])
  const [isBulking, setIsBulking] = useState(false)

  async function loadImported(t: TmdbType) {
    const table = t === 'movie' ? 'movies' : t === 'series' ? 'series' : 'people'
    const posterCol = t === 'person' ? 'selected_profile_url' : 'selected_poster_url'
    const { data } = await supabase.from(table).select(`tmdb_id,${posterCol}`).not('tmdb_id', 'is', null)
    const map: Record<number, string> = {}
    for (const row of data ?? []) {
      const url = (row as any)[posterCol]
      if (row.tmdb_id && url) map[row.tmdb_id] = url
    }
    setImported(map)
  }

  const title = useMemo(() => (type === 'movie' ? 'Movies' : type === 'series' ? 'Series' : 'People'), [type])

  useEffect(() => { loadImported(type) }, [type])

  async function search() {
    setError(null)
    setIsLoading(true)
    setSelected(new Set())
    setBulkStatus([])
    try {
      setResults(await tmdbSearch(type, query.trim()))
    } catch (e: any) {
      setError(e?.message ?? 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === results.length) setSelected(new Set())
    else setSelected(new Set(results.map((r) => r.id)))
  }

  async function doImport(tmdbId: number) {
    setError(null)
    setImportingId(tmdbId)
    try {
      const name = type === 'movie' ? await importMovie(tmdbId) : type === 'series' ? await importSeries(tmdbId) : await importPerson(tmdbId)
      alert(`Imported: ${name}`)
      await loadImported(type)
    } catch (e: any) {
      setError(e?.message ?? 'Import failed')
    } finally {
      setImportingId(null)
    }
  }

  async function doBulkImport() {
    const ids = [...selected]
    if (!ids.length) return
    setIsBulking(true)
    setBulkStatus(ids.map((id) => {
      const r = results.find((r) => r.id === id)
      return { id, status: 'pending', label: r?.title ?? r?.name ?? `#${id}` }
    }))

    for (const id of ids) {
      setBulkStatus((prev) => prev.map((s) => s.id === id ? { ...s, status: 'importing' } : s))
      try {
        type === 'movie' ? await importMovie(id) : type === 'series' ? await importSeries(id) : await importPerson(id)
        setBulkStatus((prev) => prev.map((s) => s.id === id ? { ...s, status: 'done' } : s))
      } catch (e: any) {
        setBulkStatus((prev) => prev.map((s) => s.id === id ? { ...s, status: 'error', error: e?.message } : s))
      }
    }

    setIsBulking(false)
    setSelected(new Set())
    await loadImported(type)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">TMDb Import</h1>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap gap-2">
          {(['movie', 'series', 'person'] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setResults([]); setSelected(new Set()); setBulkStatus([]) }}
              className={['rounded-xl border px-3 py-2 text-xs', t === type ? 'border-white bg-white text-neutral-950' : 'border-white/10 bg-white/5 text-white/80'].join(' ')}>
              {t === 'movie' ? 'Movies' : t === 'series' ? 'Series' : 'People'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder={`Search ${title}…`} />
          <Button disabled={isLoading || !query.trim()} onClick={search} className="shrink-0">Search</Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      {bulkStatus.length > 0 && (
        <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Bulk import progress</div>
          {bulkStatus.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <span className={s.status === 'done' ? 'text-green-400' : s.status === 'error' ? 'text-red-400' : s.status === 'importing' ? 'text-yellow-400' : 'text-white/40'}>
                {s.status === 'done' ? '✓' : s.status === 'error' ? '✗' : s.status === 'importing' ? '…' : '○'}
              </span>
              <span className="flex-1 truncate">{s.label}</span>
              {s.error ? <span className="text-red-300 truncate max-w-[120px]">{s.error}</span> : null}
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <button onClick={toggleAll} className="text-xs text-white/60 hover:text-white">
            {selected.size === results.length ? 'Deselect all' : `Select all (${results.length})`}
          </button>
          {selected.size > 0 && (
            <Button disabled={isBulking} onClick={doBulkImport}>
              {isBulking ? 'Importing…' : `Import ${selected.size} selected`}
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => {
          const imgPath = r.poster_path ?? r.profile_path
          const imgUrl = imgPath ? `https://image.tmdb.org/t/p/w342${imgPath}` : (imported[r.id] ?? null)
          const isSelected = selected.has(r.id)
          return (
            <div key={r.id} onClick={() => toggleSelect(r.id)}
              className={['flex gap-3 rounded-3xl border p-3 cursor-pointer transition-colors', isSelected ? 'border-white bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/8'].join(' ')}>
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/10">
                {imgUrl ? <img src={imgUrl} alt={r.title ?? r.name} className="h-full w-full object-cover" /> : null}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-950 text-xs font-bold">✓</div>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                  <div className="text-sm font-semibold leading-snug">{r.title ?? r.name ?? `#${r.id}`}</div>
                  {r.overview ? <p className="mt-1 line-clamp-2 text-xs text-white/60">{r.overview}</p> : null}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-white/50">TMDb #{r.id}</div>
                  <Button disabled={importingId === r.id || isBulking} onClick={(e) => { e.stopPropagation(); doImport(r.id) }}>
                    {importingId === r.id ? 'Importing…' : 'Import'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!results.length ? <div className="text-sm text-white/60">Search TMDb to import content.</div> : null}
    </div>
  )
}
