import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, ImageIcon, Check } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null; sort_order: number }
type CollectionItem = { id: string; sort_order: number; movie: { id: string; title: string } | null; series: { id: string; title: string } | null }
type SearchResult = { id: string; title: string; type: 'movie' | 'series' }
type BackdropMovie = { id: string; title: string; backdrop_images: string[]; selected_backdrop_url: string | null }

function BackdropPicker({ onPick }: { onPick: (url: string) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<BackdropMovie[]>([])
  const [selected, setSelected] = useState<BackdropMovie | null>(null)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('movies')
        .select('id,title,backdrop_images,selected_backdrop_url')
        .ilike('title', `%${q}%`)
        .limit(6)
      setResults(((data ?? []) as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        backdrop_images: Array.isArray(r.backdrop_images) ? r.backdrop_images : [],
        selected_backdrop_url: r.selected_backdrop_url,
      })))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  const backdrops = selected
    ? [selected.selected_backdrop_url, ...selected.backdrop_images].filter(Boolean) as string[]
    : []

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
        <ImageIcon size={12} /> Pick from movie backdrops
      </div>
      <div className="relative">
        <Input
          placeholder="Search a movie…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSelected(null) }}
        />
        {results.length > 0 && !selected && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-white/10 bg-neutral-900 shadow-xl overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setQ(r.title); setResults([]) }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                {r.selected_backdrop_url && (
                  <img src={r.selected_backdrop_url} alt={r.title} className="h-8 w-14 rounded object-cover shrink-0" />
                )}
                <span className="text-sm truncate">{r.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && backdrops.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {backdrops.map((url) => (
            <button
              key={url}
              onClick={() => onPick(url)}
              className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-accent transition-colors"
            >
              <img src={url} alt="" className="aspect-video w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check size={18} className="text-accent" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && backdrops.length === 0 && (
        <div className="text-xs text-white/30">No backdrops found for this movie.</div>
      )}
    </div>
  )
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, CollectionItem[]>>({})
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCover, setNewCover] = useState('')
  const [showBackdropPicker, setShowBackdropPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  // per-collection cover editing
  const [editingCover, setEditingCover] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('collections').select('id,name,description,cover_image_url,sort_order').order('sort_order')
    setCollections((data ?? []) as Collection[])
  }

  useEffect(() => { load() }, [])

  async function loadItems(collectionId: string) {
    const { data } = await supabase
      .from('collection_items')
      .select('id,sort_order,movie:movies(id,title),series:series(id,title)')
      .eq('collection_id', collectionId)
      .order('sort_order')
    setItems((prev) => ({ ...prev, [collectionId]: (data ?? []) as unknown as CollectionItem[] }))
  }

  function toggleExpand(id: string) {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    setEditingCover(null)
    loadItems(id)
  }

  async function createCollection() {
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('collections').insert({ name: newName.trim(), description: newDesc.trim() || null, cover_image_url: newCover.trim() || null })
    setNewName(''); setNewDesc(''); setNewCover(''); setShowBackdropPicker(false)
    await load()
    setSaving(false)
  }

  async function deleteCollection(id: string) {
    if (!confirm('Delete this collection?')) return
    await supabase.from('collections').delete().eq('id', id)
    setCollections((prev) => prev.filter((c) => c.id !== id))
    if (expanded === id) setExpanded(null)
  }

  async function updateCover(collectionId: string, url: string) {
    await supabase.from('collections').update({ cover_image_url: url }).eq('id', collectionId)
    setCollections((prev) => prev.map((c) => c.id === collectionId ? { ...c, cover_image_url: url } : c))
    setEditingCover(null)
  }

  async function removeItem(collectionId: string, itemId: string) {
    await supabase.from('collection_items').delete().eq('id', itemId)
    setItems((prev) => ({ ...prev, [collectionId]: prev[collectionId].filter((i) => i.id !== itemId) }))
  }

  async function addItem(collectionId: string, result: SearchResult) {
    const payload = result.type === 'movie'
      ? { collection_id: collectionId, movie_id: result.id }
      : { collection_id: collectionId, series_id: result.id }
    await supabase.from('collection_items').insert(payload)
    setSearchQ(''); setSearchResults([])
    loadItems(collectionId)
  }

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const [m, s] = await Promise.all([
        supabase.from('movies').select('id,title').ilike('title', `%${searchQ}%`).limit(5),
        supabase.from('series').select('id,title').ilike('title', `%${searchQ}%`).limit(5),
      ])
      setSearchResults([
        ...((m.data ?? []) as any[]).map((r) => ({ id: r.id, title: r.title, type: 'movie' as const })),
        ...((s.data ?? []) as any[]).map((r) => ({ id: r.id, title: r.title, type: 'series' as const })),
      ])
    }, 250)
    return () => clearTimeout(t)
  }, [searchQ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Collections</h1>

      {/* Create new */}
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">New Collection</div>
        <Input placeholder="Name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />

        {/* Cover: manual URL or backdrop picker */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input placeholder="Cover image URL (optional)" value={newCover} onChange={(e) => setNewCover(e.target.value)} />
            <button
              type="button"
              onClick={() => setShowBackdropPicker((v) => !v)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${showBackdropPicker ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 bg-white/5 text-white/60 hover:text-white'}`}
            >
              <ImageIcon size={13} /> Pick
            </button>
          </div>
          {newCover && (
            <img src={newCover} alt="cover preview" className="h-20 w-full rounded-xl object-cover border border-white/10" />
          )}
          {showBackdropPicker && (
            <BackdropPicker onPick={(url) => { setNewCover(url); setShowBackdropPicker(false) }} />
          )}
        </div>

        <Button disabled={saving || !newName.trim()} onClick={createCollection}>
          <Plus size={14} /> Create
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {collections.length === 0 && <div className="text-sm text-white/40">No collections yet.</div>}
        {collections.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-3 p-4">
              {c.cover_image_url && (
                <img src={c.cover_image_url} alt={c.name} className="h-10 w-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.name}</div>
                {c.description && <div className="truncate text-xs text-white/40">{c.description}</div>}
              </div>
              <button
                onClick={() => setEditingCover(editingCover === c.id ? null : c.id)}
                className={`shrink-0 p-1 transition-colors ${editingCover === c.id ? 'text-accent' : 'text-white/30 hover:text-white'}`}
                title="Change cover"
              >
                <ImageIcon size={15} />
              </button>
              <button onClick={() => deleteCollection(c.id)} className="shrink-0 text-white/30 hover:text-red-400 transition-colors p-1">
                <Trash2 size={15} />
              </button>
              <button onClick={() => toggleExpand(c.id)} className="shrink-0 text-white/40 hover:text-white transition-colors p-1">
                {expanded === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Cover editor */}
            {editingCover === c.id && (
              <div className="border-t border-white/10 p-4">
                <BackdropPicker onPick={(url) => updateCover(c.id, url)} />
              </div>
            )}

            {/* Expanded items */}
            {expanded === c.id && (
              <div className="border-t border-white/10 p-4 space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Search movies or series to add…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-white/10 bg-neutral-900 shadow-xl overflow-hidden">
                      {searchResults.map((r) => (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => addItem(c.id, r)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5 text-white/50 uppercase">{r.type}</span>
                          <span className="text-sm">{r.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  {(items[c.id] ?? []).length === 0 && (
                    <div className="text-xs text-white/30">No items yet. Search above to add.</div>
                  )}
                  {(items[c.id] ?? []).map((item) => {
                    const content = (Array.isArray(item.movie) ? item.movie[0] : item.movie) ?? (Array.isArray(item.series) ? item.series[0] : item.series)
                    const type = item.movie ? 'movie' : 'series'
                    if (!content) return null
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                        <span className="text-[10px] rounded bg-white/10 px-1.5 py-0.5 text-white/50 uppercase shrink-0">{type}</span>
                        <span className="flex-1 truncate text-sm">{content.title}</span>
                        <button onClick={() => removeItem(c.id, item.id)} className="shrink-0 text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
