import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import ImageUploader from '../../ui/ImageUploader'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type Series = {
  id: string
  title: string
  overview: string | null
  first_air_date: string | null
  tmdb_rating: number | null
  trailer_url: string | null
  selected_poster_url: string | null
  selected_backdrop_url: string | null
  selected_logo_url: string | null
  poster_images: string[]
  backdrop_images: string[]
  title_logos: string[]
}

type Platform = { id: string; name: string; logo_url: string | null; category: string }
type Editing = Partial<Series> & { id: string }
type LinkRow = { id: string; label: string; url: string; sort_order: number; platform_id: string | null; cover_image_url: string | null; platform?: { name: string; logo_url: string | null } | null }
type NewLink = { platform_id: string; url: string; cover_image_url: string }
type PersonOption = { id: string; name: string; selected_profile_url: string | null }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }

function LinksSection({ title, links, platforms, newLink, onNewLink, onAdd, onDelete, bucket }: {
  title: string
  links: LinkRow[]
  platforms: Platform[]
  newLink: NewLink
  onNewLink: (l: NewLink) => void
  onAdd: () => void
  onDelete: (id: string) => void
  bucket: string
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-white/50">{title}</div>
      {links.map((l) => {
        const logo = l.platform?.logo_url
        const name = l.platform?.name ?? l.label
        return (
          <div key={l.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            {l.cover_image_url ? (
              <img src={l.cover_image_url} alt={name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-7 w-10 shrink-0 items-center justify-center rounded bg-white/10">
                {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[36px] object-contain" /> : null}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate text-xs font-medium">{name}</div>
              <div className="truncate text-xs text-white/40">{l.url}</div>
            </div>
            <button onClick={() => onDelete(l.id)} className="shrink-0 text-xs text-red-300 hover:text-red-200">Remove</button>
          </div>
        )
      })}
      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
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
        </div>
        <div className="flex items-center gap-3">
          <ImageUploader bucket={bucket} folder="music-covers" label="Cover image" onUploaded={(url) => onNewLink({ ...newLink, cover_image_url: url })} />
          {newLink.cover_image_url && <img src={newLink.cover_image_url} alt="cover" className="h-10 w-10 rounded-lg object-cover" />}
          <Button disabled={!newLink.platform_id || !newLink.url.trim()} onClick={onAdd} className="ml-auto shrink-0">Add</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSeriesPage() {
  const [items, setItems] = useState<Series[]>([])
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [newStreaming, setNewStreaming] = useState<NewLink>({ platform_id: '', url: '', cover_image_url: '' })
  const [newMusic, setNewMusic] = useState<NewLink>({ platform_id: '', url: '', cover_image_url: '' })
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [allPeople, setAllPeople] = useState<PersonOption[]>([])
  const [peopleSearch, setPeopleSearch] = useState('')
  const [peopleSearching, setPeopleSearching] = useState(false)
  const [newCredit, setNewCredit] = useState({ person_id: '', credit_type: 'cast' as 'cast' | 'crew', role: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase
      .from('series')
      .select('id,title,overview,first_air_date,tmdb_rating,trailer_url,selected_poster_url,selected_backdrop_url,selected_logo_url,poster_images,backdrop_images,title_logos')
      .order('title')
    setItems((data ?? []) as Series[])
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    supabase.from('platforms').select('id,name,logo_url,category').order('name').then(({ data }) => setPlatforms((data ?? []) as Platform[]))
  }, [])

  useEffect(() => {
    const q = peopleSearch.trim()
    if (!q) { setAllPeople([]); return }
    setPeopleSearching(true)
    const timer = setTimeout(() => {
      supabase.from('people').select('id,name,selected_profile_url').ilike('name', `%${q}%`).order('name').limit(20)
        .then(({ data }) => { setAllPeople((data ?? []) as PersonOption[]); setPeopleSearching(false) })
    }, 250)
    return () => clearTimeout(timer)
  }, [peopleSearch])

  async function loadLinks(seriesId: string) {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from('series_streaming_links').select('id,label,url,sort_order,platform_id,cover_image_url,platform:platforms(name,logo_url)').eq('series_id', seriesId).order('sort_order'),
      supabase.from('series_music_links').select('id,label,url,sort_order,platform_id,cover_image_url,platform:platforms(name,logo_url)').eq('series_id', seriesId).order('sort_order'),
    ])
    setStreamingLinks((s ?? []) as unknown as LinkRow[])
    setMusicLinks((m ?? []) as unknown as LinkRow[])
  }

  async function loadCredits(seriesId: string) {
    const { data } = await supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('series_id', seriesId).order('sort_order')
    setCredits((data ?? []) as unknown as CreditRow[])
  }

  async function startEdit(s: Series) {
    setEditing(s)
    setNewStreaming({ platform_id: '', url: '', cover_image_url: '' })
    setNewMusic({ platform_id: '', url: '', cover_image_url: '' })
    setNewCredit({ person_id: '', credit_type: 'cast', role: '' })
    setPeopleSearch('')
    setAllPeople([])
    await Promise.all([loadLinks(s.id), loadCredits(s.id)])
  }

  async function addCredit() {
    if (!editing || !newCredit.person_id) return
    const payload: any = { series_id: editing.id, person_id: newCredit.person_id, credit_type: newCredit.credit_type, sort_order: credits.length }
    if (newCredit.credit_type === 'cast') payload.character = newCredit.role || null
    else payload.job = newCredit.role || null
    const { error: e } = await supabase.from('credits').insert(payload)
    if (e) { setError(e.message); return }
    setNewCredit({ person_id: '', credit_type: 'cast', role: '' })
    setPeopleSearch('')
    setAllPeople([])
    await loadCredits(editing.id)
  }

  async function removeCredit(creditId: string) {
    await supabase.from('credits').delete().eq('id', creditId)
    if (editing) await loadCredits(editing.id)
  }

  async function addStreaming() {
    if (!editing) return
    const platform = platforms.find((p) => p.id === newStreaming.platform_id)
    const { error: e } = await supabase.from('series_streaming_links').insert({ series_id: editing.id, platform_id: newStreaming.platform_id, label: platform?.name ?? '', url: newStreaming.url.trim(), sort_order: streamingLinks.length, cover_image_url: newStreaming.cover_image_url || null })
    if (e) { setError(e.message); return }
    setNewStreaming({ platform_id: '', url: '', cover_image_url: '' })
    await loadLinks(editing.id)
  }

  async function deleteStreaming(id: string) {
    await supabase.from('series_streaming_links').delete().eq('id', id)
    if (editing) await loadLinks(editing.id)
  }

  async function addMusic() {
    if (!editing) return
    const platform = platforms.find((p) => p.id === newMusic.platform_id)
    const { error: e } = await supabase.from('series_music_links').insert({ series_id: editing.id, platform_id: newMusic.platform_id, label: platform?.name ?? '', url: newMusic.url.trim(), sort_order: musicLinks.length, cover_image_url: newMusic.cover_image_url || null })
    if (e) { setError(e.message); return }
    setNewMusic({ platform_id: '', url: '', cover_image_url: '' })
    await loadLinks(editing.id)
  }

  async function deleteMusic(id: string) {
    await supabase.from('series_music_links').delete().eq('id', id)
    if (editing) await loadLinks(editing.id)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const { id, ...fields } = editing
    const { error: e } = await supabase.from('series').update(fields).eq('id', id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null)
    await refresh()
    setSaving(false)
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    const { error: e } = await supabase.from('series').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  if (editing) {
    const s = editing
    const set = (k: keyof Editing, v: any) => setEditing((p) => ({ ...p!, [k]: v }))
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <AdminBackButton />
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
            <h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>
          </div>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Title</span>
            <Input value={s.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Overview</span>
            <textarea value={s.overview ?? ''} onChange={(e) => set('overview', e.target.value)} rows={4} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">First air date</span>
              <Input value={s.first_air_date ?? ''} onChange={(e) => set('first_air_date', e.target.value || null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">TMDb rating</span>
              <Input type="number" step="0.1" value={s.tmdb_rating ?? ''} onChange={(e) => set('tmdb_rating', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label className="block space-y-1 col-span-2">
              <span className="text-xs text-white/50">Trailer URL</span>
              <Input value={s.trailer_url ?? ''} onChange={(e) => set('trailer_url', e.target.value || null)} />
            </label>
          </div>

          {(['poster_images', 'backdrop_images', 'title_logos'] as const).map((key) => {
            const label = key === 'poster_images' ? 'Posters' : key === 'backdrop_images' ? 'Backdrops' : 'Logos'
            const selectedKey = key === 'poster_images' ? 'selected_poster_url' : key === 'backdrop_images' ? 'selected_backdrop_url' : 'selected_logo_url'
            const urls: string[] = (s[key] as string[]) ?? []
            if (!urls.length) return null
            return (
              <div key={key} className="space-y-2">
                <div className="text-xs text-white/50">{label} ({urls.length}) — tap to select active</div>
                <div className={['flex gap-2 overflow-x-auto pb-2', key === 'poster_images' ? 'items-end' : 'items-center'].join(' ')}>
                  {urls.map((url) => {
                    const isSelected = s[selectedKey] === url
                    return (
                      <div key={url} className="relative shrink-0 group">
                        <button onClick={() => set(selectedKey, url)} className={['relative overflow-hidden rounded-xl border-2 transition-all', isSelected ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'].join(' ')}>
                          <img src={url} alt="" className={key === 'poster_images' ? 'h-32 w-auto object-cover' : key === 'backdrop_images' ? 'h-20 w-auto object-cover' : 'h-12 w-auto object-contain'} />
                          {isSelected && <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this image?')) {
                              const updated = urls.filter((u) => u !== url)
                              set(key, updated)
                              if (s[selectedKey] === url) {
                                set(selectedKey, updated[0] ?? null)
                              }
                            }
                          }}
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-white/50">Cast & Crew</div>
              {credits.map((c) => {
                const person = Array.isArray(c.person) ? c.person[0] : c.person
                if (!person) return null
                return (
                  <div key={c.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {person.selected_profile_url ? <img src={person.selected_profile_url} alt={person.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-medium">{person.name}</div>
                      <div className="text-xs text-white/40">{c.credit_type === 'cast' ? (c.character ?? 'Cast') : (c.job ?? 'Crew')}</div>
                    </div>
                    <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/60">{c.credit_type}</span>
                    <button onClick={() => removeCredit(c.id)} className="shrink-0 text-xs text-red-300 hover:text-red-200">Remove</button>
                  </div>
                )
              })}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">Add person</div>
                <Input value={peopleSearch} onChange={(e) => { setPeopleSearch(e.target.value); setNewCredit((prev) => ({ ...prev, person_id: '' })) }} placeholder="Search people…" />
                {peopleSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {peopleSearching && <div className="px-2 py-1 text-xs text-white/40">Searching…</div>}
                    {!peopleSearching && allPeople.map((p) => (
                      <button key={p.id} onClick={() => { setNewCredit((prev) => ({ ...prev, person_id: p.id })); setPeopleSearch(p.name) }}
                        className={['flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/10', newCredit.person_id === p.id ? 'bg-white/10' : ''].join(' ')}>
                        <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/10">
                          {p.selected_profile_url ? <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <span className="truncate text-xs">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <select value={newCredit.credit_type} onChange={(e) => setNewCredit((prev) => ({ ...prev, credit_type: e.target.value as 'cast' | 'crew' }))} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none">
                    <option value="cast">Cast</option>
                    <option value="crew">Crew</option>
                  </select>
                  <Input value={newCredit.role} onChange={(e) => setNewCredit((prev) => ({ ...prev, role: e.target.value }))} placeholder={newCredit.credit_type === 'cast' ? 'Character name' : 'Job title'} className="flex-1" />
                  <Button disabled={!newCredit.person_id} onClick={addCredit} className="shrink-0">Add</Button>
                </div>
              </div>
            </div>
            <LinksSection title="Streaming links" links={streamingLinks} platforms={platforms.filter((p) => p.category === 'ott')} newLink={newStreaming} onNewLink={setNewStreaming} onAdd={addStreaming} onDelete={deleteStreaming} bucket="series-images" />
            <LinksSection title="Music links" links={musicLinks} platforms={platforms.filter((p) => p.category === 'music')} newLink={newMusic} onNewLink={setNewMusic} onAdd={addMusic} onDelete={deleteMusic} bucket="series-images" />
          </div>

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Series ({items.length})</h1>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search series…" />
      <div className="space-y-2">
        {items.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())).map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            {s.selected_poster_url
              ? <img src={s.selected_poster_url} alt="" className="h-12 w-8 rounded-lg object-cover shrink-0" />
              : <div className="h-12 w-8 rounded-lg bg-white/10 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-white/50">{s.first_air_date?.slice(0, 4) ?? '—'} · ★ {s.tmdb_rating ?? '—'}</div>
            </div>
            <button onClick={() => startEdit(s)} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
            <button onClick={() => remove(s.id, s.title)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!items.length ? <div className="text-sm text-white/60">No series imported yet.</div> : null}
      </div>
    </div>
  )
}
