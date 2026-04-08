import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import ImageUploader from '../../ui/ImageUploader'
import { supabase } from '../../../lib/supabase'

type Movie = {
  id: string
  title: string
  overview: string | null
  release_date: string | null
  runtime_minutes: number | null
  tmdb_rating: number | null
  trailer_url: string | null
  show_logo: boolean
  selected_poster_url: string | null
  selected_backdrop_url: string | null
  selected_logo_url: string | null
  poster_images: string[]
  backdrop_images: string[]
  title_logos: string[]
}

type Platform = { id: string; name: string; logo_url: string | null }
type Editing = Partial<Movie> & { id: string }
type LinkRow = { id: string; label: string; url: string; sort_order: number; platform_id: string | null; platform?: { name: string; logo_url: string | null } | null }
type NewLink = { platform_id: string; url: string }

function LinksSection({ title, links, platforms, newLink, onNewLink, onAdd, onDelete }: {
  title: string
  links: LinkRow[]
  platforms: Platform[]
  newLink: NewLink
  onNewLink: (l: NewLink) => void
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-white/50">{title}</div>
      {links.map((l) => {
        const logo = l.platform?.logo_url
        const name = l.platform?.name ?? l.label
        return (
          <div key={l.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-white/10">
              {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[36px] object-contain" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium">{name}</div>
              <div className="truncate text-xs text-white/40">{l.url}</div>
            </div>
            <button onClick={() => onDelete(l.id)} className="shrink-0 text-xs text-red-300 hover:text-red-200">Remove</button>
          </div>
        )
      })}
      <div className="flex gap-2">
        <select
          value={newLink.platform_id}
          onChange={(e) => onNewLink({ ...newLink, platform_id: e.target.value })}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-white/25"
        >
          <option value="">Select platform…</option>
          {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Input value={newLink.url} onChange={(e) => onNewLink({ ...newLink, url: e.target.value })} placeholder="URL" className="flex-1" />
        <Button disabled={!newLink.platform_id || !newLink.url.trim()} onClick={onAdd} className="shrink-0">Add</Button>
      </div>
    </div>
  )
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [newStreaming, setNewStreaming] = useState<NewLink>({ platform_id: '', url: '' })
  const [newMusic, setNewMusic] = useState<NewLink>({ platform_id: '', url: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase
      .from('movies')
      .select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,show_logo,selected_poster_url,selected_backdrop_url,selected_logo_url,poster_images,backdrop_images,title_logos')
      .order('title')
    setMovies((data ?? []) as Movie[])
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    supabase.from('platforms').select('id,name,logo_url').order('name').then(({ data }) => setPlatforms((data ?? []) as Platform[]))
  }, [])

  async function loadLinks(movieId: string) {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from('movie_streaming_links').select('id,label,url,sort_order,platform_id,platform:platforms(name,logo_url)').eq('movie_id', movieId).order('sort_order'),
      supabase.from('movie_music_links').select('id,label,url,sort_order,platform_id,platform:platforms(name,logo_url)').eq('movie_id', movieId).order('sort_order'),
    ])
    setStreamingLinks((s ?? []) as unknown as LinkRow[])
    setMusicLinks((m ?? []) as unknown as LinkRow[])
  }

  async function startEdit(m: Movie) {
    setEditing(m)
    setNewStreaming({ platform_id: '', url: '' })
    setNewMusic({ platform_id: '', url: '' })
    await loadLinks(m.id)
  }

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

  async function addStreaming() {
    if (!editing) return
    const platform = platforms.find((p) => p.id === newStreaming.platform_id)
    const sort_order = streamingLinks.length
    const { error: e } = await supabase.from('movie_streaming_links').insert({ movie_id: editing.id, platform_id: newStreaming.platform_id, label: platform?.name ?? '', url: newStreaming.url.trim(), sort_order })
    if (e) { setError(e.message); return }
    setNewStreaming({ platform_id: '', url: '' })
    await loadLinks(editing.id)
  }

  async function deleteStreaming(id: string) {
    await supabase.from('movie_streaming_links').delete().eq('id', id)
    if (editing) await loadLinks(editing.id)
  }

  async function addMusic() {
    if (!editing) return
    const platform = platforms.find((p) => p.id === newMusic.platform_id)
    const sort_order = musicLinks.length
    const { error: e } = await supabase.from('movie_music_links').insert({ movie_id: editing.id, platform_id: newMusic.platform_id, label: platform?.name ?? '', url: newMusic.url.trim(), sort_order })
    if (e) { setError(e.message); return }
    setNewMusic({ platform_id: '', url: '' })
    await loadLinks(editing.id)
  }

  async function deleteMusic(id: string) {
    await supabase.from('movie_music_links').delete().eq('id', id)
    if (editing) await loadLinks(editing.id)
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
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
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
          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
            <span className="text-sm">Show logo on grid</span>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <button type="button" onClick={() => set('show_logo', true)} className={['rounded-md px-3 py-1 text-xs font-semibold transition-colors', m.show_logo ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>On</button>
              <button type="button" onClick={() => set('show_logo', false)} className={['rounded-md px-3 py-1 text-xs font-semibold transition-colors', !m.show_logo ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>Off</button>
            </div>
          </label>

          {(['poster_images', 'backdrop_images', 'title_logos'] as const).map((key) => {
            const label = key === 'poster_images' ? 'Posters' : key === 'backdrop_images' ? 'Backdrops' : 'Logos'
            const uploadLabel = key === 'poster_images' ? 'Poster' : key === 'backdrop_images' ? 'Backdrop' : 'Logo'
            const selectedKey = key === 'poster_images' ? 'selected_poster_url' : key === 'backdrop_images' ? 'selected_backdrop_url' : 'selected_logo_url'
            const urls: string[] = [...new Set((m[key] as string[]) ?? [])]
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">{label} ({urls.length}) — tap to select active</div>
                  <ImageUploader bucket="movie-images" folder={m.id} label={uploadLabel} onUploaded={(url) => { const updated = [url, ...urls.filter((u) => u !== url)]; set(key, updated); set(selectedKey, url) }} />
                </div>
                {urls.length ? (
                  <div className={['flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', key === 'poster_images' ? 'items-end' : 'items-center'].join(' ')}>
                    {urls.map((url) => {
                      const isSelected = m[selectedKey] === url
                      return (
                        <button key={url} onClick={() => set(selectedKey, url)}
                          className={['relative shrink-0 overflow-hidden rounded-xl border-2 transition-all', isSelected ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'].join(' ')}>
                          <img src={url} alt="" className={key === 'poster_images' ? 'h-32 w-auto object-cover' : key === 'backdrop_images' ? 'h-20 w-auto object-cover' : 'h-12 w-auto object-contain'} />
                          {isSelected && <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}

          <div className="border-t border-white/10 pt-4 space-y-4">
            <LinksSection
              title="Streaming links"
              links={streamingLinks}
              platforms={platforms}
              newLink={newStreaming}
              onNewLink={setNewStreaming}
              onAdd={addStreaming}
              onDelete={deleteStreaming}
            />
            <LinksSection
              title="Music links"
              links={musicLinks}
              platforms={platforms}
              newLink={newMusic}
              onNewLink={setNewMusic}
              onAdd={addMusic}
              onDelete={deleteMusic}
            />
          </div>

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
            <button onClick={() => startEdit(m)} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
            <button onClick={() => remove(m.id, m.title)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!movies.length ? <div className="text-sm text-white/60">No movies imported yet.</div> : null}
      </div>
    </div>
  )
}
