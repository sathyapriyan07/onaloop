import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PosterGridSkeleton from '../ui/PosterGridSkeleton'

type Series = {
  id: string; title: string; first_air_date: string | null
  original_language: string | null; selected_poster_url: string | null
  selected_logo_url: string | null; overview: string | null
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean',
}
const langLabel = (code: string) => LANG_NAMES[code] ?? code.toUpperCase()

function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={clsx('shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            o === value ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white')}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function SeriesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')

  useEffect(() => {
    let isMounted = true
    supabase.from('series').select('id,title,first_air_date,original_language,selected_poster_url,selected_logo_url,overview')
      .order('first_air_date', { ascending: false }).limit(300)
      .then(({ data }) => { if (isMounted) { setSeries((data ?? []) as Series[]); setLoading(false) } })
    return () => { isMounted = false }
  }, [])

  const years = useMemo(() => {
    const s = new Set(series.map((m) => m.first_air_date?.slice(0, 4)).filter(Boolean) as string[])
    return ['All', ...Array.from(s).sort((a, b) => Number(b) - Number(a))]
  }, [series])

  const langs = useMemo(() => {
    const s = new Set(series.map((m) => m.original_language).filter(Boolean) as string[])
    return ['All', ...Array.from(s).sort()]
  }, [series])

  const filtered = useMemo(() => series.filter((s) => {
    if (yearFilter !== 'All' && s.first_air_date?.slice(0, 4) !== yearFilter) return false
    if (langFilter !== 'All' && s.original_language !== langFilter) return false
    return true
  }), [series, yearFilter, langFilter])

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Series</h1>
        <div className="inline-flex rounded-lg p-0.5" style={{ background: '#1a1a1a' }}>
          <button onClick={() => setView('grid')} className={clsx('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors', view === 'grid' ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white')}>
            <LayoutGrid size={13} /> Grid
          </button>
          <button onClick={() => setView('list')} className={clsx('inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors', view === 'list' ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white')}>
            <List size={13} /> List
          </button>
        </div>
      </div>

      <Tabs options={years} value={yearFilter} onChange={setYearFilter} />
      <Tabs options={langs.map((l) => l === 'All' ? 'All' : langLabel(l))} value={langFilter === 'All' ? 'All' : langLabel(langFilter)} onChange={(v) => setLangFilter(v === 'All' ? 'All' : langs.find((l) => langLabel(l) === v) ?? v)} />

      {view === 'grid' ? (
        loading ? <PosterGridSkeleton count={18} /> : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {filtered.filter(s => s.selected_poster_url).map((s) => (
              <Link key={s.id} to={`/series/${s.id}`} className="group relative overflow-hidden rounded-xl bg-neutral-900 aspect-[2/3]">
                <img src={s.selected_poster_url!} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  {s.selected_logo_url
                    ? <img src={s.selected_logo_url} alt="" className="max-h-7 max-w-[85%] object-contain object-left drop-shadow-md" loading="lazy" />
                    : <div className="line-clamp-2 text-xs font-bold leading-tight">{s.title}</div>}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-xl skeleton" />)
            : filtered.map((s) => (
              <Link key={s.id} to={`/series/${s.id}`} className="flex gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors" style={{ background: '#161616' }}>
                <div className="w-12 aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800 shrink-0">
                  {s.selected_poster_url ? <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="truncate text-sm font-bold">{s.title}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-white/40">
                    {s.first_air_date ? <span>{s.first_air_date.slice(0, 4)}</span> : null}
                    {s.original_language ? <span>{langLabel(s.original_language)}</span> : null}
                  </div>
                </div>
              </Link>
            ))
          }
        </div>
      )}

      {!loading && !filtered.length ? <div className="text-sm text-white/40 text-center py-10">No series found.</div> : null}
    </div>
  )
}
