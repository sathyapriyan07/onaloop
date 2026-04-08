import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import ImageUploader from '../../ui/ImageUploader'
import { supabase } from '../../../lib/supabase'

type Platform = { id: string; name: string; logo_url: string | null }
type Editing = { id: string; name: string; logo_url: string }

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [editing, setEditing] = useState<Editing | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase.from('platforms').select('id,name,logo_url').order('name')
    setPlatforms((data ?? []) as Platform[])
  }

  useEffect(() => { refresh() }, [])

  async function create() {
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    const { error: e } = await supabase.from('platforms').insert({ name: newName.trim() })
    if (e) { setError(e.message); setCreating(false); return }
    setNewName('')
    await refresh()
    setCreating(false)
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const { error: e } = await supabase.from('platforms').update({
      name: editing.name,
      logo_url: editing.logo_url || null,
    }).eq('id', editing.id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null)
    await refresh()
    setSaving(false)
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const { error: e } = await supabase.from('platforms').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Platforms ({platforms.length})</h1>

      <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/50">New platform</div>
        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Platform name (e.g. Netflix)" />
          <Button disabled={creating || !newName.trim()} onClick={create} className="shrink-0">Add</Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="space-y-2">
        {platforms.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5">
            {editing?.id === p.id ? (
              <div className="space-y-3 p-3">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
                <div className="flex items-center gap-3">
                  {editing.logo_url
                    ? <img src={editing.logo_url} alt="" className="h-8 w-auto max-w-[80px] object-contain" />
                    : <div className="h-8 w-8 rounded bg-white/10" />}
                  <ImageUploader
                    bucket="movie-images"
                    folder="platform-logos"
                    label="Logo"
                    onUploaded={(url) => setEditing({ ...editing, logo_url: url })}
                  />
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
                  {p.logo_url
                    ? <img src={p.logo_url} alt={p.name} className="h-6 w-auto max-w-[40px] object-contain" />
                    : null}
                </div>
                <div className="flex-1 text-sm font-semibold">{p.name}</div>
                <button onClick={() => setEditing({ id: p.id, name: p.name, logo_url: p.logo_url ?? '' })} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
                <button onClick={() => remove(p.id, p.name)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
              </div>
            )}
          </div>
        ))}
        {!platforms.length ? <div className="text-sm text-white/60">No platforms yet.</div> : null}
      </div>
    </div>
  )
}
