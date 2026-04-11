import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import AdminBackButton from '../../ui/AdminBackButton'
import ImageUploader from '../../ui/ImageUploader'
import { supabase } from '../../../lib/supabase'

type Person = {
  id: string
  name: string
  bio: string | null
  birthday: string | null
  place_of_birth: string | null
  known_for_department: string | null
  selected_profile_url: string | null
  profile_images: string[]
  social_links: { platform: string; url: string }[]
}

type Editing = Partial<Person> & { id: string }

const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'applemusic', label: 'Apple Music' },
  { value: 'youtubemusic', label: 'YouTube Music' },
  { value: 'website', label: 'Website' },
]

const SOUND_PLATFORMS = ['spotify', 'applemusic', 'youtubemusic', 'youtube', 'instagram', 'x', 'website']
const DEFAULT_PLATFORMS = ['instagram', 'x', 'facebook', 'youtube', 'website']

export default function AdminPeoplePage() {
  const [people, setPeople] = useState<Person[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Editing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    const all: Person[] = []
    const pageSize = 1000
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('people')
        .select('id,name,bio,birthday,place_of_birth,known_for_department,selected_profile_url,profile_images,social_links')
        .order('name')
        .range(from, from + pageSize - 1)
      if (!data || data.length === 0) break
      all.push(...(data as Person[]))
      if (data.length < pageSize) break
      from += pageSize
    }
    setPeople(all)
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Department</span>
              <Input value={p.known_for_department ?? ''} onChange={(e) => set('known_for_department', e.target.value || null)} />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Birthday</span>
              <Input type="date" value={p.birthday ?? ''} onChange={(e) => set('birthday', e.target.value || null)} />
            </label>
            <label className="block space-y-1 col-span-2">
              <span className="text-xs text-white/50">Place of birth</span>
              <Input value={p.place_of_birth ?? ''} onChange={(e) => set('place_of_birth', e.target.value || null)} />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Bio</span>
            <textarea
              value={p.bio ?? ''}
              onChange={(e) => set('bio', e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10"
            />
          </label>
          {(() => {
            const urls: string[] = (p.profile_images as string[]) ?? []
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">Profile photo ({urls.length}) — select active</div>
                  <ImageUploader
                    bucket="movie-images"
                    folder={`people/${p.id}`}
                    label="Photo"
                    onUploaded={(url) => {
                      const updated = [url, ...urls.filter((u) => u !== url)]
                      set('profile_images', updated)
                      set('selected_profile_url', url)
                    }}
                  />
                </div>
                {urls.length ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {urls.map((url) => {
                      const isSelected = p.selected_profile_url === url
                      return (
                        <button key={url} onClick={() => set('selected_profile_url', url)}
                          className={['relative shrink-0 overflow-hidden rounded-xl border-2 transition-all', isSelected ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'].join(' ')}>
                          <img src={url} alt="" className="h-24 w-16 object-cover" />
                          {isSelected && <div className="absolute inset-x-0 bottom-0 bg-white/90 py-0.5 text-center text-xs font-bold text-neutral-950">Active</div>}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })()}
          {(() => {
            const links: { platform: string; url: string }[] = (p.social_links as any) ?? []
            const dept = (p.known_for_department ?? '').toLowerCase()
            const isSound = dept.includes('sound') || dept.includes('music')
            const suggested = SOCIAL_PLATFORMS.filter((pl) =>
              isSound ? SOUND_PLATFORMS.includes(pl.value) : DEFAULT_PLATFORMS.includes(pl.value)
            )
            return (
              <div className="space-y-2">
                <div className="text-xs text-white/50">Social & Music Links</div>
                {links.map((lnk, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={lnk.platform}
                      onChange={(e) => { const updated = [...links]; updated[i] = { ...lnk, platform: e.target.value }; set('social_links', updated) }}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
                    >
                      {SOCIAL_PLATFORMS.map((pl) => <option key={pl.value} value={pl.value}>{pl.label}</option>)}
                    </select>
                    <Input value={lnk.url} onChange={(e) => { const updated = [...links]; updated[i] = { ...lnk, url: e.target.value }; set('social_links', updated) }} placeholder="URL" className="flex-1" />
                    <button type="button" onClick={() => set('social_links', links.filter((_, j) => j !== i))} className="text-xs text-red-300 hover:text-red-200 shrink-0">Remove</button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5">
                  {suggested.filter((pl) => !links.find((l) => l.platform === pl.value)).map((pl) => (
                    <button key={pl.value} type="button"
                      onClick={() => set('social_links', [...links, { platform: pl.value, url: '' }])}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10">
                      + {pl.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}
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
