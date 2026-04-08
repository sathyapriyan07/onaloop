import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type Genre = { id: string; name: string; tmdb_id: number | null; display_image_url: string | null }
type Editing = { id: string; name: string; display_image_url: string; images: string[]; imageSearch: string }

async function loadGenreImages(genreId: string): Promise<string[]> {
  const [{ data: mg }, { data: sg }] = await Promise.all([
    supabase.from('movie_genres')
      .select('movie:movies(backdrop_images,poster_images)')
      .eq('genre_id', genreId)
      .limit(20),
    supabase.from('series_genres')
      .select('series:series(backdrop_images,poster_images)')
      .eq('genre_id', genreId)
      .limit(20),
  ])
  const urls: string[] = []
  for (const row of [...(mg ?? []), ...(sg ?? [])] as any[]) {
    const item = row.movie ?? row.series
    if (!item) continue
    urls.push(...(item.backdrop_images ?? []), ...(item.poster_images ?? []))
  }
  return [...new Set(urls)]
}

async function searchImages(query: string): Promise<string[]> {
  if (!query.trim()) return []
  const [{ data: movies }, { data: series }] = await Promise.all([
    supabase.from('movies').select('backdrop_images,poster_images').ilike('title', `%${query}%`).limit(10),
    supabase.from('series').select('backdrop_images,poster_images').ilike('title', `%${query}%`).limit(10),
  ])
  const urls: string[] = []
  for (const row of [...(movies ?? []), ...(series ?? [])] as any[]) {
    urls.push(...(row.backdrop_images ?? []), ...(row.poster_images ?? []))
  }
  return [...new Set(urls)]
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [searchingImages, setSearchingImages] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('genres').select('id,name,tmdb_id,display_image_url').order('name')
    setGenres((data ?? []) as Genre[])
  }

  useEffect(() => { refresh() }, [])

  async function startEdit(g: Genre) {
    setLoadingImages(true)
    const images = await loadGenreImages(g.id)
    setEditing({ id: g.id, name: g.name, display_image_url: g.display_image_url ?? '', images, imageSearch: '' })
    setLoadingImages(false)
  }

  async function doImageSearch(query: string) {
    if (!editing) return
    setEditing({ ...editing, imageSearch: query })
    if (!query.trim()) return
    setSearchingImages(true)
    const results = await searchImages(query)
    setEditing((prev) => prev ? { ...prev, images: [...new Set([...results, ...prev.images])] } : prev)
    setSearchingImages(false)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const { error: e } = await supabase.from('genres').update({
      name: editing.name,
      display_image_url: editing.display_image_url || null,
    }).eq('id', editing.id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null)
    await refresh()
    setSaving(false)
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete genre "${name}"? This removes all genre links.`)) return
    const { error: e } = await supabase.from('genres').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  if (editing) {
    return (
      <div className="space-y-6">
      <div className="space-y-1">
          <AdminBackButton />
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
            <h1 className="text-xl font-semibold tracking-tight">{editing.name}</h1>
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Name</span>
            <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </label>

          <div className="space-y-2">
            <div className="text-xs text-white/50">Display image — select from imported content</div>
            <div className="flex gap-2">
              <Input
                value={editing.imageSearch}
                onChange={(e) => doImageSearch(e.target.value)}
                placeholder="Search by movie/series title…"
              />
              {searchingImages ? <span className="shrink-0 text-xs text-white/40 self-center">Searching…</span> : null}
            </div>
            {editing.images.length ? (
              <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {editing.images.map((url) => {
                  const isSelected = editing.display_image_url === url
                  return (
                    <button
                      key={url}
                      onClick={() => setEditing({ ...editing, display_image_url: url })}
                      className={[
                        'relative shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                        isSelected ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100',
                      ].join(' ')}
                    >
                      <img src={url} alt="" className="h-24 w-auto object-cover" />
                      {isSelected && (
                        <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-white/40">No images available — import movies/series in this genre first.</div>
            )}
          </div>

          {editing.display_image_url ? (
            <div className="space-y-1">
              <div className="text-xs text-white/50">Selected</div>
              <img src={editing.display_image_url} alt="" className="h-24 w-40 rounded-xl object-cover" />
            </div>
          ) : null}

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <div className="flex gap-2">
            <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
            <button onClick={() => setEditing(null)} className="text-xs text-white/50 hover:text-white">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Genres ({genres.length})</h1>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <div className="space-y-2">
        {genres.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
              {g.display_image_url
                ? <img src={g.display_image_url} alt={g.name} className="h-full w-full object-cover" />
                : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{g.name}</div>
              {g.tmdb_id ? <div className="text-xs text-white/50">TMDb #{g.tmdb_id}</div> : null}
            </div>
            <button
              disabled={loadingImages}
              onClick={() => startEdit(g)}
              className="text-xs text-white/60 hover:text-white shrink-0 disabled:opacity-40"
            >
              {loadingImages ? 'Loading…' : 'Edit'}
            </button>
            <button onClick={() => remove(g.id, g.name)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!genres.length ? <div className="text-sm text-white/60">No genres yet. Import movies/series to populate.</div> : null}
      </div>
    </div>
  )
}
