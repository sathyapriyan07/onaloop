import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import ImageUploader from '../../ui/ImageUploader'
import AdminBackButton from '../../ui/AdminBackButton'
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
  gallery_images: string[]
  tags: string[]
  budget: string | null
  collection: string | null
  imdb_rating: number | null
  rotten_tomatoes_rating: number | null
}

type Platform = { id: string; name: string; logo_url: string | null; category: string }
type ProductionHouse = { id: string; name: string; logo_url: string | null }
type Editing = Partial<Movie> & { id: string }
type LinkRow = { id: string; label: string; url: string; sort_order: number; platform_id: string | null; cover_image_url: string | null; platform?: { name: string; logo_url: string | null } | null }
type NewLink = { platform_id: string; url: string; cover_image_url: string }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }
type PersonOption = { id: string; name: string; selected_profile_url: string | null }

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
          <ImageUploader
            bucket={bucket}
            folder="music-covers"
            label="Cover image"
            onUploaded={(url) => onNewLink({ ...newLink, cover_image_url: url })}
          />
          {newLink.cover_image_url && (
            <img src={newLink.cover_image_url} alt="cover" className="h-10 w-10 rounded-lg object-cover" />
          )}
          <Button disabled={!newLink.platform_id || !newLink.url.trim()} onClick={onAdd} className="ml-auto shrink-0">Add</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [search, setSearch] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [productionHouses, setProductionHouses] = useState<ProductionHouse[]>([])
  const [assignedStudios, setAssignedStudios] = useState<ProductionHouse[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [tagInput, setTagInput] = useState('')
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
    const all: Movie[] = []
    const pageSize = 1000
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('movies')
        .select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,show_logo,selected_poster_url,selected_backdrop_url,selected_logo_url,poster_images,backdrop_images,title_logos,gallery_images,tags,budget,collection,imdb_rating,rotten_tomatoes_rating')
        .order('title')
        .range(from, from + pageSize - 1)
      if (!data || data.length === 0) break
      all.push(...(data as Movie[]))
      if (data.length < pageSize) break
      from += pageSize
    }
    setMovies(all)
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    supabase.from('platforms').select('id,name,logo_url,category').order('name').then(({ data }) => setPlatforms((data ?? []) as Platform[]))
    supabase.from('production_houses').select('id,name,logo_url').order('name').then(({ data }) => setProductionHouses((data ?? []) as ProductionHouse[]))
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

  async function loadLinks(movieId: string) {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from('movie_streaming_links').select('id,label,url,sort_order,platform_id,cover_image_url,platform:platforms(name,logo_url)').eq('movie_id', movieId).order('sort_order'),
      supabase.from('movie_music_links').select('id,label,url,sort_order,platform_id,cover_image_url,platform:platforms(name,logo_url)').eq('movie_id', movieId).order('sort_order'),
    ])
    setStreamingLinks((s ?? []) as unknown as LinkRow[])
    setMusicLinks((m ?? []) as unknown as LinkRow[])
  }

  async function startEdit(m: Movie) {
    setEditing(m)
    setTagInput('')
    setNewStreaming({ platform_id: '', url: '', cover_image_url: '' })
    setNewMusic({ platform_id: '', url: '', cover_image_url: '' })
    setNewCredit({ person_id: '', credit_type: 'cast', role: '' })
    setPeopleSearch('')
    setAllPeople([])
    const { data: studioRows } = await supabase.from('movie_production_houses').select('production_house:production_houses(id,name,logo_url)').eq('movie_id', m.id)
    const studios = ((studioRows ?? []) as any[]).map((r) => Array.isArray(r.production_house) ? r.production_house[0] : r.production_house).filter(Boolean)
    setAssignedStudios(studios as ProductionHouse[])
  }

  async function loadCredits(movieId: string) {
    const { data } = await supabase
      .from('credits')
      .select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)')
      .eq('movie_id', movieId)
      .order('sort_order')
    setCredits((data ?? []) as unknown as CreditRow[])
  }

  async function updateTags(next: string[]) {
    if (!editing) return
    setError(null)
    setEditing((p) => p ? ({ ...p, tags: next }) : p)
    const { error: e } = await supabase.from('movies').update({ tags: next }).eq('id', editing.id)
    if (e) setError(e.message)
  }

  async function addCredit() {
    if (!editing || !newCredit.person_id) return
    const sort_order = credits.length
    const payload: any = {
      movie_id: editing.id,
      person_id: newCredit.person_id,
      credit_type: newCredit.credit_type,
      sort_order,
    }
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
    const { error: e } = await supabase.from('movie_streaming_links').insert({ movie_id: editing.id, platform_id: newStreaming.platform_id, label: platform?.name ?? '', url: newStreaming.url.trim(), sort_order, cover_image_url: newStreaming.cover_image_url || null })
    if (e) { setError(e.message); return }
    setNewStreaming({ platform_id: '', url: '', cover_image_url: '' })
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
    const { error: e } = await supabase.from('movie_music_links').insert({ movie_id: editing.id, platform_id: newMusic.platform_id, label: platform?.name ?? '', url: newMusic.url.trim(), sort_order, cover_image_url: newMusic.cover_image_url || null })
    if (e) { setError(e.message); return }
    setNewMusic({ platform_id: '', url: '', cover_image_url: '' })
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
        <div className="space-y-1">
          <AdminBackButton />
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
            <h1 className="text-xl font-semibold tracking-tight">{m.title}</h1>
          </div>
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
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">TMDb rating</span>
              <Input type="number" step="0.1" value={m.tmdb_rating ?? ''} onChange={(e) => set('tmdb_rating', e.target.value ? Number(e.target.value) : null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">IMDb rating</span>
              <Input type="number" step="0.1" min="0" max="10" value={m.imdb_rating ?? ''} onChange={(e) => set('imdb_rating', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 8.5" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Rotten Tomatoes %</span>
              <Input type="number" min="0" max="100" value={m.rotten_tomatoes_rating ?? ''} onChange={(e) => set('rotten_tomatoes_rating', e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 95" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Trailer URL</span>
              <Input value={m.trailer_url ?? ''} onChange={(e) => set('trailer_url', e.target.value || null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Budget</span>
              <Input value={m.budget ?? ''} onChange={(e) => set('budget', e.target.value || null)} placeholder="e.g. 30 Cr, 45 Lakhs" />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Collection</span>
              <Input value={m.collection ?? ''} onChange={(e) => set('collection', e.target.value || null)} placeholder="e.g. 300 Cr, 1.2 Billion" />
            </label>
          </div>
          {(() => {
            const tags: string[] = (m.tags as string[]) ?? []
            return (
              <div className="space-y-2">
                <div className="text-xs text-white/50">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      {tag}
                      <button type="button" onClick={() => updateTags(tags.filter((t) => t !== tag))} className="text-white/40 hover:text-red-300 leading-none">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder='e.g. Highest grossing movie of 2026'
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = tagInput.trim()
                        if (val && !tags.includes(val)) updateTags([...tags, val])
                        setTagInput('')
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={!tagInput.trim()}
                    onClick={() => {
                      const val = tagInput.trim()
                      if (val && !tags.includes(val)) updateTags([...tags, val])
                      setTagInput('')
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="text-xs text-white/30">Press Enter (or click Add) to add a tag</div>
              </div>
            )
          })()}

          <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 cursor-pointer">
            <span className="text-sm">Show logo on grid</span>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              <button type="button" onClick={() => set('show_logo', true)} className={['rounded-md px-3 py-1 text-xs font-semibold transition-colors', m.show_logo ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>On</button>
              <button type="button" onClick={() => set('show_logo', false)} className={['rounded-md px-3 py-1 text-xs font-semibold transition-colors', !m.show_logo ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>Off</button>
            </div>
          </label>

          {(['poster_images', 'backdrop_images', 'title_logos', 'gallery_images'] as const).map((key) => {
            const label = key === 'poster_images' ? 'Posters' : key === 'backdrop_images' ? 'Backdrops' : key === 'title_logos' ? 'Logos' : 'Gallery Images'
            const uploadLabel = key === 'poster_images' ? 'Poster' : key === 'backdrop_images' ? 'Backdrop' : key === 'title_logos' ? 'Logo' : 'Gallery Image'
            const selectedKey = key === 'poster_images' ? 'selected_poster_url' : key === 'backdrop_images' ? 'selected_backdrop_url' : key === 'title_logos' ? 'selected_logo_url' : null
            const urls: string[] = [...new Set((m[key] as string[]) ?? [])]
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">{label} ({urls.length}){selectedKey ? ' — tap to select active' : ''}</div>
                  <ImageUploader bucket="movie-images" folder={m.id} label={uploadLabel} onUploaded={(url) => { const updated = [url, ...urls.filter((u) => u !== url)]; set(key, updated); if (selectedKey) set(selectedKey, url) }} />
                </div>
                {urls.length ? (
                  <div className={['flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', key === 'poster_images' ? 'items-end' : 'items-center'].join(' ')}>
                    {urls.map((url) => {
                      const isSelected = selectedKey ? m[selectedKey] === url : false
                      return (
                        <div key={url} className="relative shrink-0 group">
                          <button onClick={() => selectedKey && set(selectedKey, url)}
                            className={['relative overflow-hidden rounded-xl border-2 transition-all', selectedKey ? (isSelected ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100') : 'border-white/20'].join(' ')}>
                            <img src={url} alt="" className={key === 'poster_images' ? 'h-32 w-auto object-cover' : key === 'backdrop_images' ? 'h-20 w-auto object-cover' : key === 'title_logos' ? 'h-12 w-auto object-contain' : 'h-24 w-auto object-cover'} />
                            {selectedKey && isSelected && <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this image?')) {
                                const updated = urls.filter((u) => u !== url)
                                set(key, updated)
                                if (selectedKey && m[selectedKey] === url) {
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
                ) : null}
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
                  <select value={newCredit.credit_type} onChange={(e) => setNewCredit((prev) => ({ ...prev, credit_type: e.target.value as 'cast' | 'crew' }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white outline-none">
                    <option value="cast">Cast</option>
                    <option value="crew">Crew</option>
                  </select>
                  <Input value={newCredit.role} onChange={(e) => setNewCredit((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder={newCredit.credit_type === 'cast' ? 'Character name' : 'Job title'} className="flex-1" />
                  <Button disabled={!newCredit.person_id} onClick={addCredit} className="shrink-0">Add</Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-white/50">Production Houses</div>
              <div className="flex flex-wrap gap-2">
                {assignedStudios.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-4 w-auto max-w-[40px] object-contain" /> : null}
                    <span className="text-xs font-medium">{s.name}</span>
                    <button onClick={async () => {
                      await supabase.from('movie_production_houses').delete().eq('movie_id', editing!.id).eq('production_house_id', s.id)
                      setAssignedStudios((prev) => prev.filter((x) => x.id !== s.id))
                    }} className="text-white/40 hover:text-red-300 text-xs leading-none">&times;</button>
                  </div>
                ))}
              </div>
              <select
                defaultValue=""
                onChange={async (e) => {
                  const phId = e.target.value; if (!phId || !editing) return
                  if (assignedStudios.find((s) => s.id === phId)) return
                  await supabase.from('movie_production_houses').insert({ movie_id: editing.id, production_house_id: phId })
                  const ph = productionHouses.find((p) => p.id === phId)
                  if (ph) setAssignedStudios((prev) => [...prev, ph])
                  e.target.value = ''
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none w-full"
              >
                <option value="">+ Assign production house…</option>
                {productionHouses.filter((p) => !assignedStudios.find((s) => s.id === p.id)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <LinksSection
              title="Streaming links"
              links={streamingLinks}
              platforms={platforms.filter((p) => p.category === 'ott')}
              newLink={newStreaming}
              onNewLink={setNewStreaming}
              onAdd={addStreaming}
              onDelete={deleteStreaming}
              bucket="movie-images"
            />
            <LinksSection
              title="Music links"
              links={musicLinks}
              platforms={platforms.filter((p) => p.category === 'music')}
              newLink={newMusic}
              onNewLink={setNewMusic}
              onAdd={addMusic}
              onDelete={deleteMusic}
              bucket="movie-images"
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
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Movies ({movies.length})</h1>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies…" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase())).map((m) => (
          <div key={m.id} className="group relative">
            <button onClick={() => startEdit(m)} className="w-full text-left">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                {m.selected_poster_url
                  ? <img src={m.selected_poster_url} alt={m.title} className="h-full w-full object-cover" loading="lazy" />
                  : <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/30">{m.title}</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-1.5">
                  <div className="line-clamp-2 text-[10px] font-semibold leading-tight">{m.title}</div>
                  {m.release_date ? <div className="text-[10px] text-white/50">{m.release_date.slice(0, 4)}</div> : null}
                </div>
              </div>
            </button>
            <button onClick={() => remove(m.id, m.title)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-red-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80">&times;</button>
          </div>
        ))}
        {!movies.length ? <div className="col-span-full text-sm text-white/60">No movies imported yet.</div> : null}
      </div>
    </div>
  )
}
