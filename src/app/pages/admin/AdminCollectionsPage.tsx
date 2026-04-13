import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import Button from '../../ui/Button'
import Input from '../../ui/Input'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null; sort_order: number }
type CollectionItem = { id: string; sort_order: number; movie: { id: string; title: string } | null; series: { id: string; title: string } | null }
type SearchResult = { id: string; title: string; type: 'movie' | 'series' }

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, CollectionItem[]>>({})
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCover, setNewCover] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

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
    loadItems(id)
  }

  async function createCollection() {
    if (!newName.trim()) return
    setSaving(true)
    await supabase.from('collections').insert({ name: newName.trim(), description: newDesc.trim() || null, cover_image_url: newCover.trim() || null })
    setNewName(''); setNewDesc(''); setNewCover('')
    await load()
    setSaving(false)
  }

  async function deleteCollection(id: string) {
    if (!confirm('Delete this collection?')) return
    await supabase.from('collections').delete().eq('id', id)
    setCollections((prev) => prev.filter((c) => c.id !== id))
    if (expanded === id) setExpanded(null)
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
        <Input placeholder="Cover image URL (optional)" value={newCover} onChange={(e) => setNewCover(e.target.value)} />
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
              <button onClick={() => deleteCollection(c.id)} className="shrink-0 text-white/30 hover:text-red-400 transition-colors p-1">
                <Trash2 size={15} />
              </button>
              <button onClick={() => toggleExpand(c.id)} className="shrink-0 text-white/40 hover:text-white transition-colors p-1">
                {expanded === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded items */}
            {expanded === c.id && (
              <div className="border-t border-white/10 p-4 space-y-3">
                {/* Add item search */}
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

                {/* Current items */}
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
