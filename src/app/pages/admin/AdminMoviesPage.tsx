import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { supabase } from '../../../lib/supabase'

type Movie = {
  id: string
  title: string
  overview: string | null
  release_date: string | null
  runtime_minutes: number | null
  tmdb_rating: number | null
  trailer_url: string | null
  selected_poster_url: string | null
  selected_backdrop_url: string | null
  selected_logo_url: string | null
  poster_images: string[]
  backdrop_images: string[]
  title_logos: string[]
}

type Editing = Partial<Movie> & { id: string }

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase
      .from('movies')
      .select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,selected_poster_url,selected_backdrop_url,selected_logo_url,poster_images,backdrop_images,title_logos')
      .order('title')
    setMovies((data ?? []) as Movie[])
  }

  useEffect(() => { refresh() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const { id, ...fields } = editing
    const { error: e } = await supabase.from('movies').update(fields).eq('id', id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null)
    await refresh()
    setSaving(false)
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This also removes all credits and genre links.`)) return
    const { error: e } = await supabase.from('movies').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  if (editing) {
    const m = editing
    const set = (k: keyof Editing, v: any) => setEditing((p) => ({ ...p!, [k]: v }))
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
          <h1 className="text-xl font-semibold tracking-tight">{m.title}</h1>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Title</span>
            <Input value={m.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Overview</span>
            <textarea
              value={m.overview ?? ''}
              onChange={(e) => set('overview', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Release date</span>
              <Input value={m.release_date ?? ''} onChange={(e) => set('release_date', e.target.value || null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Runtime (min)</span>
              <Input type="number" value={m.runtime_minutes ?? ''} onChange={(e) => set('runtime_minutes', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">TMDb rating</span>
              <Input type="number" step="0.1" value={m.tmdb_rating ?? ''} onChange={(e) => set('tmdb_rating', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Trailer URL</span>
              <Input value={m.trailer_url ?? ''} onChange={(e) => set('trailer_url', e.target.value || null)} />
            </label>
          </div>

          {(['poster_images', 'backdrop_images', 'title_logos'] as const).map((key) => {
            const label = key === 'poster_images' ? 'Poster' : key === 'backdrop_images' ? 'Backdrop' : 'Logo'
            const selectedKey = key === 'poster_images' ? 'selected_poster_url' : key === 'backdrop_images' ? 'selected_backdrop_url' : 'selected_logo_url'
            const urls: string[] = (m[key] as string[]) ?? []
            return urls.length ? (
              <div key={key} className="space-y-2">
                <div className="text-xs text-white/50">{label} — select active</div>
                <div className="flex flex-wrap gap-2">
                  {urls.map((url) => (
                    <button key={url} onClick={() => set(selectedKey, url)}
                      className={['rounded-xl overflow-hidden border-2', m[selectedKey] === url ? 'border-white' : 'border-transparent'].join(' ')}>
                      <img src={url} alt="" className="h-20 w-auto object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          })}

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Movies ({movies.length})</h1>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="space-y-2">
        {movies.map((m) => (
          <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            {m.selected_poster_url
              ? <img src={m.selected_poster_url} alt="" className="h-12 w-8 rounded-lg object-cover shrink-0" />
              : <div className="h-12 w-8 rounded-lg bg-white/10 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{m.title}</div>
              <div className="text-xs text-white/50">{m.release_date?.slice(0, 4) ?? '—'} · {m.runtime_minutes ? `${m.runtime_minutes}m` : '—'} · ★ {m.tmdb_rating ?? '—'}</div>
            </div>
            <button onClick={() => setEditing(m)} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
            <button onClick={() => remove(m.id, m.title)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!movies.length ? <div className="text-sm text-white/60">No movies imported yet.</div> : null}
      </div>
    </div>
  )
}
