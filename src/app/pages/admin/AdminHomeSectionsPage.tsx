import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type HomeSection = { id: string; title: string; slug: string | null; sort_order: number }

type ContentRow = {
  id: string
  title: string
  selected_poster_url: string | null
  _type: 'movie' | 'series'
}

type SectionItem = {
  id: string
  sort_order: number
  content: ContentRow
}

type Editing = { id: string; title: string; sort_order: number }

export default function AdminHomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems] = useState<SectionItem[]>([])
  const [allContent, setAllContent] = useState<ContentRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const { data } = await supabase
      .from('home_sections')
      .select('id,title,slug,sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setSections((data ?? []) as HomeSection[])
  }

  useEffect(() => { refresh() }, [])

  async function loadItems(sectionId: string) {
    const [{ data: movieItems }, { data: seriesItems }] = await Promise.all([
      supabase.from('home_section_items')
        .select('id,sort_order,movie:movies(id,title,selected_poster_url)')
        .eq('section_id', sectionId)
        .not('movie_id', 'is', null)
        .order('sort_order'),
      supabase.from('home_section_items')
        .select('id,sort_order,series:series(id,title,selected_poster_url)')
        .eq('section_id', sectionId)
        .not('series_id', 'is', null)
        .order('sort_order'),
    ])

    const mapped: SectionItem[] = [
      ...((movieItems ?? []).map((i: any) => ({
        id: i.id, sort_order: i.sort_order,
        content: { ...i.movie, _type: 'movie' as const },
      }))),
      ...((seriesItems ?? []).map((i: any) => ({
        id: i.id, sort_order: i.sort_order,
        content: { ...i.series, _type: 'series' as const },
      }))),
    ].sort((a, b) => a.sort_order - b.sort_order)

    setItems(mapped)

    const [{ data: movies }, { data: series }] = await Promise.all([
      supabase.from('movies').select('id,title,selected_poster_url').order('title'),
      supabase.from('series').select('id,title,selected_poster_url').order('title'),
    ])
    setAllContent([
      ...((movies ?? []).map((m: any) => ({ ...m, _type: 'movie' as const }))),
      ...((series ?? []).map((s: any) => ({ ...s, _type: 'series' as const }))),
    ])
  }

  async function expand(sectionId: string) {
    if (expanded === sectionId) { setExpanded(null); return }
    setExpanded(sectionId)
    await loadItems(sectionId)
  }

  async function create() {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    const slug = newTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order ?? 0), 0)
    const { error: e } = await supabase.from('home_sections').insert({ title: newTitle.trim(), slug, sort_order: maxOrder + 1 })
    if (e) setError(e.message)
    else { setNewTitle(''); await refresh() }
    setCreating(false)
  }

  async function saveEdit() {
    if (!editing) return
    const { error: e } = await supabase.from('home_sections')
      .update({ title: editing.title, sort_order: editing.sort_order })
      .eq('id', editing.id)
    if (e) { setError(e.message); return }
    setEditing(null)
    await refresh()
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    const { error: e } = await supabase.from('home_sections').delete().eq('id', id)
    if (e) { setError(e.message); return }
    if (expanded === id) setExpanded(null)
    await refresh()
  }

  async function addItem(sectionId: string, content: ContentRow) {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0)
    const payload = content._type === 'movie'
      ? { section_id: sectionId, movie_id: content.id, sort_order: maxOrder + 1 }
      : { section_id: sectionId, series_id: content.id, sort_order: maxOrder + 1 }
    const { error: e } = await supabase.from('home_section_items').insert(payload)
    if (e) { setError(e.message); return }
    await loadItems(sectionId)
  }

  async function removeItem(sectionId: string, itemId: string) {
    const { error: e } = await supabase.from('home_section_items').delete().eq('id', itemId)
    if (e) { setError(e.message); return }
    await loadItems(sectionId)
  }

  const existingIds = new Set(items.map((i) => i.content.id))

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Homepage Sections</h1>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">New section</div>
        <div className="flex gap-2">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Section title (e.g. Trending)" />
          <Button disabled={creating || !newTitle.trim()} onClick={create} className="shrink-0">Add</Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5">
            {editing?.id === s.id ? (
              <div className="flex items-center gap-2 p-3">
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="flex-1" />
                <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="w-20" />
                <Button onClick={saveEdit}>Save</Button>
                <button onClick={() => setEditing(null)} className="text-xs text-white/50 hover:text-white">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3">
                <button onClick={() => expand(s.id)} className="flex-1 text-left">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-white/50">order: {s.sort_order} · {s.slug}</div>
                </button>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => expand(s.id)} className="text-xs text-white/60 hover:text-white">
                    {expanded === s.id ? 'Collapse' : 'Items'}
                  </button>
                  <button onClick={() => setEditing({ id: s.id, title: s.title, sort_order: s.sort_order ?? 0 })} className="text-xs text-white/60 hover:text-white">Edit</button>
                  <button onClick={() => remove(s.id, s.title)} className="text-xs text-red-300 hover:text-red-200">Delete</button>
                </div>
              </div>
            )}

            {expanded === s.id && (
              <div className="border-t border-white/10 p-3 space-y-3">
                {items.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {items.map((item) => (
                      <div key={item.id} className="relative shrink-0">
                        <div className="h-24 w-16 overflow-hidden rounded-xl bg-white/10">
                          {item.content.selected_poster_url
                            ? <img src={item.content.selected_poster_url} alt={item.content.title} className="h-full w-full object-cover" />
                            : null}
                        </div>
                        <div className="mt-1 w-16 truncate text-center text-xs text-white/60">{item.content.title}</div>
                        <button
                          onClick={() => removeItem(s.id, item.id)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                        >×</button>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-xs text-white/50">No items yet.</div>}

                <div className="space-y-1">
                  <div className="text-xs text-white/50">Add content</div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {allContent.filter((c) => !existingIds.has(c.id)).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => addItem(s.id, c)}
                        className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                      >
                        <div className="h-8 w-6 shrink-0 overflow-hidden rounded bg-white/10">
                          {c.selected_poster_url ? <img src={c.selected_poster_url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <span className="truncate text-xs">{c.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-white/40">{c._type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {!sections.length ? <div className="text-sm text-white/60">No sections yet.</div> : null}
      </div>
    </div>
  )
}
