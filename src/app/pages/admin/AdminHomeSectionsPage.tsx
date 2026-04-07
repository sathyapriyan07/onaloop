import { useEffect, useState } from 'react'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { supabase } from '../../../lib/supabase'

type HomeSection = { id: string; title: string; slug: string | null; sort_order: number | null }

export default function AdminHomeSectionsPage() {
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<HomeSection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function refresh() {
    const { data } = await supabase
      .from('home_sections')
      .select('id,title,slug,sort_order')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setSections((data ?? []) as HomeSection[])
  }

  useEffect(() => {
    refresh()
  }, [])

  async function create() {
    setError(null)
    setIsLoading(true)
    try {
      const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const { error: insertError } = await supabase.from('home_sections').insert({ title: title.trim(), slug })
      if (insertError) throw insertError
      setTitle('')
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create section')
    } finally {
      setIsLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this section?')) return
    setError(null)
    const { error: deleteError } = await supabase.from('home_sections').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Homepage sections</h1>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">Create section</div>
        <div className="flex gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Section title (e.g., Trending)" />
          <Button disabled={isLoading || !title.trim()} onClick={create} className="shrink-0">
            Add
          </Button>
        </div>
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="mt-1 text-xs text-white/50">{s.slug ?? s.id}</div>
            </div>
            <button onClick={() => remove(s.id)} className="text-xs text-red-300 hover:text-red-200">
              Delete
            </button>
          </div>
        ))}
        {!sections.length ? <div className="text-sm text-white/60">No sections yet.</div> : null}
      </div>
    </div>
  )
}

