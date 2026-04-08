import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type Person = {
  id: string
  name: string
  bio: string | null
  selected_profile_url: string | null
  profile_images: string[]
}

type Editing = Partial<Person> & { id: string }

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const { data } = await supabase
      .from('people')
      .select('id,name,bio,selected_profile_url,profile_images')
      .order('name')
    setPeople((data ?? []) as Person[])
  }

  useEffect(() => { refresh() }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    setError(null)
    const { id, ...fields } = editing
    const { error: e } = await supabase.from('people').update(fields).eq('id', id)
    if (e) { setError(e.message); setSaving(false); return }
    setEditing(null)
    await refresh()
    setSaving(false)
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This also removes all their credits.`)) return
    const { error: e } = await supabase.from('people').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  if (editing) {
    const p = editing
    const set = (k: keyof Editing, v: any) => setEditing((prev) => ({ ...prev!, [k]: v }))
    const urls: string[] = (p.profile_images as string[]) ?? []
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <AdminBackButton />
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="text-sm text-white/50 hover:text-white">← Back</button>
            <h1 className="text-xl font-semibold tracking-tight">{p.name}</h1>
          </div>
        </div>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Name</span>
            <Input value={p.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Bio</span>
            <textarea
              value={p.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10"
            />
          </label>
          {urls.length ? (
            <div className="space-y-2">
              <div className="text-xs text-white/50">Profile photo — select active</div>
              <div className="flex flex-wrap gap-2">
                {urls.map((url) => (
                  <button key={url} onClick={() => set('selected_profile_url', url)}
                    className={['rounded-xl overflow-hidden border-2', p.selected_profile_url === url ? 'border-white' : 'border-transparent'].join(' ')}>
                    <img src={url} alt="" className="h-24 w-16 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
        <h1 className="text-xl font-semibold tracking-tight">People ({people.length})</h1>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people…" />
      <div className="space-y-2">
        {people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            {p.selected_profile_url
              ? <img src={p.selected_profile_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
              : <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-semibold">{p.name}</div>
              {p.bio ? <div className="line-clamp-1 text-xs text-white/50">{p.bio}</div> : null}
            </div>
            <button onClick={() => setEditing(p)} className="text-xs text-white/60 hover:text-white shrink-0">Edit</button>
            <button onClick={() => remove(p.id, p.name)} className="text-xs text-red-300 hover:text-red-200 shrink-0">Delete</button>
          </div>
        ))}
        {!people.length ? <div className="text-sm text-white/60">No people imported yet.</div> : null}
      </div>
    </div>
  )
}
