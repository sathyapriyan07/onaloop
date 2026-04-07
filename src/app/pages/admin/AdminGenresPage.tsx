import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { supabase } from '../../../lib/supabase'

type Genre = { id: string; name: string; tmdb_id: number | null; display_image_url: string | null }
type Editing = { id: string; name: string; display_image_url: string }

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('genres').select('id,name,tmdb_id,display_image_url').order('name')
    setGenres((data ?? []) as Genre[])
  }

  useEffect(() => { refresh() }, [])

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

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Genres ({genres.length})</h1>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <div className="space-y-2">
        {genres.map((g) => (
          <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5">
            {editing?.id === g.id ? (
              <div className="space-y-2 p-3">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
                <Input value={editing.display_image_url} onChange={(e) => setEditing({ ...editing, display_image_url: e.target.value })} placeholder="Display image URL" />
                {editing.display_image_url && (
                  <img src={editing.display_image_url} alt="" className="h-20 w-32 rounded-xl object-cover" />
                )}
                {error ? <div className="text-sm text-red-300">{error}</div> : null}
                <div className="flex gap-2">
                  <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
                  <button onClick={() => setEditing(null)} className="text-xs text-white/50 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3">
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  {g.display_image_url
                    ? <img src={g.display_image_url} alt={g.name} className="h-full w-full object-cover" />
                    : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{g.name}</div>
                  {g.tmdb_id ? <div className="text-xs text-white/50">TMDb #{g.tmdb_id}</div> : null}
                </div>
                <button onClick={() => setEditing({ id: g.id, name: g.name, display_image_url: g.display_image_url ?? '' })} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
                <button onClick={() => remove(g.id, g.name)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
              </div>
            )}
          </div>
        ))}
        {!genres.length ? <div className="text-sm text-white/60">No genres yet. Import movies/series to populate.</div> : null}
      </div>
    </div>
  )
}
