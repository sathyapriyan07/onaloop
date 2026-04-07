import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
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

type Editing = Partial<Series> & { id: string }

export default function AdminSeriesPage() {
  const [items, setItems] = useState<Series[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
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
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
          <h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Title</span>
            <Input value={s.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Overview</span>
            <textarea
              value={s.overview ?? ''}
              onChange={(e) => set('overview', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10"
            />
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
                      <button
                        key={url}
                        onClick={() => set(selectedKey, url)}
                        className={[
                          'relative shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                          isSelected ? 'border-white shadow-[0_0_0_2px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100',
                        ].join(' ')}
                      >
                        <img
                          src={url}
                          alt=""
                          className={key === 'poster_images' ? 'h-32 w-auto object-cover' : key === 'backdrop_images' ? 'h-20 w-auto object-cover' : 'h-12 w-auto object-contain'}
                        />
                        {isSelected && (
                          <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Series ({items.length})</h1>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <div className="space-y-2">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            {s.selected_poster_url
              ? <img src={s.selected_poster_url} alt="" className="h-12 w-8 rounded-lg object-cover shrink-0" />
              : <div className="h-12 w-8 rounded-lg bg-white/10 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-white/50">{s.first_air_date?.slice(0, 4) ?? '—'} · ★ {s.tmdb_rating ?? '—'}</div>
            </div>
            <button onClick={() => setEditing(s)} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
            <button onClick={() => remove(s.id, s.title)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!items.length ? <div className="text-sm text-white/60">No series imported yet.</div> : null}
      </div>
    </div>
  )
}
