import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import Input from '../../ui/Input'

type CollageItem = { id: string; sort_order: number; movie: { id: string; title: string; selected_poster_url: string | null } }
type SearchResult = { id: string; title: string; selected_poster_url: string | null }

export default function AdminHeroCollagePage() {
  const [items, setItems] = useState<CollageItem[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  async function load() {
    const { data } = await supabase
      .from('hero_collage')
      .select('id,sort_order,movie:movies(id,title,selected_poster_url)')
      .order('sort_order')
    setItems((data ?? []) as unknown as CollageItem[])
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('movies')
        .select('id,title,selected_poster_url')
        .ilike('title', `%${searchQ}%`)
        .limit(8)
      setSearchResults((data ?? []) as SearchResult[])
    }, 250)
    return () => clearTimeout(t)
  }, [searchQ])

  async function addMovie(movie: SearchResult) {
    const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0
    await supabase.from('hero_collage').insert({ movie_id: movie.id, sort_order: nextOrder })
    setSearchQ(''); setSearchResults([])
    load()
  }

  async function remove(id: string) {
    await supabase.from('hero_collage').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const movie = (item: CollageItem) => Array.isArray(item.movie) ? item.movie[0] : item.movie

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hero Collage</h1>
        <p className="text-xs text-white/40 mt-1">Choose which movie posters appear in the homepage hero collage.</p>
      </div>

      {/* Search + add */}
      <div className="relative">
        <Input
          placeholder="Search a movie to add…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-white/10 bg-neutral-900 shadow-xl overflow-hidden">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => addMovie(r)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <div className="h-10 w-7 shrink-0 overflow-hidden rounded-md bg-white/10">
                  {r.selected_poster_url && <img src={r.selected_poster_url} alt={r.title} className="h-full w-full object-cover" />}
                </div>
                <span className="flex-1 truncate text-sm">{r.title}</span>
                <Plus size={14} className="text-accent shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current collage items */}
      <div className="space-y-2">
        <div className="text-xs text-white/40">{items.length} poster{items.length !== 1 ? 's' : ''} in collage</div>
        {items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-sm text-white/30">
            No posters yet. Search above to add movies.
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => {
            const m = movie(item)
            if (!m) return null
            return (
              <div key={item.id} className="group relative">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {m.selected_poster_url
                    ? <img src={m.selected_poster_url} alt={m.title} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-white/30">{m.title}</div>
                  }
                </div>
                <div className="mt-1 line-clamp-1 text-[10px] text-white/50">{m.title}</div>
                <button
                  onClick={() => remove(item.id)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/60 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
