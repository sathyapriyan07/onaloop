import { useEffect, useState } from 'react'
import AdminBackButton from '../../ui/AdminBackButton'
import { supabase } from '../../../lib/supabase'

type BannerRow = {
  id: string
  sort_order: number
  movie: { id: string; title: string; selected_poster_url: string | null; selected_backdrop_url: string | null } | null
  series: { id: string; title: string; selected_poster_url: string | null; selected_backdrop_url: string | null } | null
}

type ContentRow = {
  id: string
  title: string
  selected_poster_url: string | null
  _type: 'movie' | 'series'
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([])
  const [allContent, setAllContent] = useState<ContentRow[]>([])
  const [contentSearch, setContentSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const { data } = await supabase
      .from('home_banners')
      .select('id,sort_order,movie:movies(id,title,selected_poster_url,selected_backdrop_url),series:series(id,title,selected_poster_url,selected_backdrop_url)')
      .order('sort_order')
    setBanners((data ?? []) as unknown as BannerRow[])
  }

  useEffect(() => {
    refresh()
    Promise.all([
      supabase.from('movies').select('id,title,selected_poster_url').order('title'),
      supabase.from('series').select('id,title,selected_poster_url').order('title'),
    ]).then(([{ data: movies }, { data: series }]) => {
      setAllContent([
        ...((movies ?? []).map((m: any) => ({ ...m, _type: 'movie' as const }))),
        ...((series ?? []).map((s: any) => ({ ...s, _type: 'series' as const }))),
      ])
    })
  }, [])

  async function add(content: ContentRow) {
    const sort_order = banners.length
    const payload = content._type === 'movie'
      ? { movie_id: content.id, sort_order }
      : { series_id: content.id, sort_order }
    const { error: e } = await supabase.from('home_banners').insert(payload)
    if (e) { setError(e.message); return }
    setContentSearch('')
    await refresh()
  }

  async function remove(id: string) {
    const { error: e } = await supabase.from('home_banners').delete().eq('id', id)
    if (e) { setError(e.message); return }
    await refresh()
  }

  async function moveUp(banner: BannerRow) {
    const idx = banners.findIndex((b) => b.id === banner.id)
    if (idx === 0) return
    const prev = banners[idx - 1]
    await Promise.all([
      supabase.from('home_banners').update({ sort_order: prev.sort_order }).eq('id', banner.id),
      supabase.from('home_banners').update({ sort_order: banner.sort_order }).eq('id', prev.id),
    ])
    await refresh()
  }

  async function moveDown(banner: BannerRow) {
    const idx = banners.findIndex((b) => b.id === banner.id)
    if (idx === banners.length - 1) return
    const next = banners[idx + 1]
    await Promise.all([
      supabase.from('home_banners').update({ sort_order: next.sort_order }).eq('id', banner.id),
      supabase.from('home_banners').update({ sort_order: banner.sort_order }).eq('id', next.id),
    ])
    await refresh()
  }

  const existingIds = new Set(banners.map((b) => {
    const m = Array.isArray(b.movie) ? b.movie[0] : b.movie
    const s = Array.isArray(b.series) ? b.series[0] : b.series
    return (m ?? s)?.id
  }))

  const filtered = allContent.filter((c) =>
    !existingIds.has(c.id) && c.title.toLowerCase().includes(contentSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <AdminBackButton />
        <h1 className="text-xl font-semibold tracking-tight">Hero Banners ({banners.length})</h1>
      </div>
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <div className="space-y-2">
        {banners.map((b, idx) => {
          const movie = Array.isArray(b.movie) ? b.movie[0] : b.movie
          const series = Array.isArray(b.series) ? b.series[0] : b.series
          const content = movie ?? series
          if (!content) return null
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="h-12 w-8 shrink-0 overflow-hidden rounded-lg bg-white/10">
                {content.selected_poster_url
                  ? <img src={content.selected_poster_url} alt={content.title} className="h-full w-full object-cover" />
                  : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{content.title}</div>
                <div className="text-xs text-white/40">{movie ? 'Movie' : 'Series'} · #{idx + 1}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveUp(b)} disabled={idx === 0} className="rounded-lg px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-20">↑</button>
                <button onClick={() => moveDown(b)} disabled={idx === banners.length - 1} className="rounded-lg px-2 py-1 text-xs text-white/50 hover:text-white disabled:opacity-20">↓</button>
                <button onClick={() => remove(b.id)} className="text-xs text-red-300 hover:text-red-200 ml-1">Remove</button>
              </div>
            </div>
          )
        })}
        {!banners.length ? <div className="text-sm text-white/60">No banners yet.</div> : null}
      </div>

      <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs text-white/50">Add to banner</div>
        <input
          value={contentSearch}
          onChange={(e) => setContentSearch(e.target.value)}
          placeholder="Search movies or series…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25"
        />
        {contentSearch.trim() && (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filtered.slice(0, 15).map((c) => (
              <button
                key={c.id}
                onClick={() => add(c)}
                className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
              >
                <div className="h-8 w-6 shrink-0 overflow-hidden rounded bg-white/10">
                  {c.selected_poster_url ? <img src={c.selected_poster_url} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <span className="flex-1 truncate text-xs">{c.title}</span>
                <span className="shrink-0 text-xs text-white/40">{c._type}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="text-xs text-white/40 px-2">No results.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
