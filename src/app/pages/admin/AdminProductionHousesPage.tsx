import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import ImageUploader from '../../ui/ImageUploader'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type PH = { id: string; name: string; logo_url: string | null; display_image_url: string | null; description: string | null }
type Editing = { id: string; name: string; logo_url: string; display_image_url: string; description: string }

export default function AdminProductionHousesPage() {
  const [items, setItems] = useState<PH[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('production_houses').select('id,name,logo_url,display_image_url,description').order('name')
    setItems((data ?? []) as PH[])
  }

  useEffect(() => { refresh() }, [])

  async function create() {
    if (!newName.trim()) return
    setCreating(true); setError(null)
    const { error: e } = await supabase.from('production_houses').insert({ name: newName.trim() })
    if (e) { setError(e.message); setCreating(false); return }
    setNewName(''); await refresh(); setCreating(false)
  }

  async function save() {
    if (!editing) return
    setSaving(true); setError(null)
    const { error: e } = await supabase.from('production_houses').update({
      name: editing.name,
      logo_url: editing.logo_url || null,
      display_image_url: editing.display_image_url || null,
      description: editing.description || null,
    }).eq('id', editing.id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null); await refresh(); setSaving(false)
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const { error: e } = await supabase.from('production_houses').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Production Houses ({items.length})</h1>
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/50">New production house</div>
        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Lyca Productions" onKeyDown={(e) => e.key === 'Enter' && create()} />
          <Button disabled={creating || !newName.trim()} onClick={create} className="shrink-0">Add</Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5">
            {editing?.id === p.id ? (
              <div className="space-y-3 p-3">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
                <label className="block space-y-1">
                  <span className="text-xs text-white/50">Description</span>
                  <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25" />
                </label>
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-white/50">Logo</div>
                    <div className="flex items-center gap-2">
                      {editing.logo_url ? <img src={editing.logo_url} alt="" className="h-8 w-auto max-w-[80px] object-contain" /> : null}
                      <ImageUploader bucket="movie-images" folder="production-houses" label="Logo" onUploaded={(url) => setEditing({ ...editing, logo_url: url })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/50">Display image</div>
                    <div className="flex items-center gap-2">
                      {editing.display_image_url ? <img src={editing.display_image_url} alt="" className="h-8 w-auto max-w-[80px] object-cover rounded" /> : null}
                      <ImageUploader bucket="movie-images" folder="production-houses" label="Image" onUploaded={(url) => setEditing({ ...editing, display_image_url: url })} />
                    </div>
                  </div>
                </div>
                {error ? <div className="text-sm text-red-300">{error}</div> : null}
                <div className="flex gap-2">
                  <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
                  <button onClick={() => setEditing(null)} className="text-xs text-white/50 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3">
                <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  {p.logo_url ? <img src={p.logo_url} alt={p.name} className="h-6 w-auto max-w-[40px] object-contain" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  {p.description ? <div className="truncate text-xs text-white/40">{p.description}</div> : null}
                </div>
                <button onClick={() => setEditing({ id: p.id, name: p.name, logo_url: p.logo_url ?? '', display_image_url: p.display_image_url ?? '', description: p.description ?? '' })} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
                <button onClick={() => remove(p.id, p.name)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
              </div>
            )}
          </div>
        ))}
        {!items.length ? <div className="text-sm text-white/60">No production houses yet.</div> : null}
      </div>
    </div>
  )
}
