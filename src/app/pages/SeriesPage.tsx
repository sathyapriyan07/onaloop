import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Series = {
  id: string
  title: string
  first_air_date: string | null
  original_language: string | null
  selected_poster_url: string | null
  selected_logo_url: string | null
  overview: string | null
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean',
}

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase()
}

function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={clsx(
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            o === value ? 'bg-white text-neutral-950' : 'bg-white/5 text-white/60 hover:text-white',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function SeriesPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [series, setSeries] = useState<Series[]>([])
  const [yearFilter, setYearFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('series')
        .select('id,title,first_air_date,original_language,selected_poster_url,selected_logo_url,overview')
        .order('first_air_date', { ascending: false })
        .limit(300)
      if (!isMounted) return
      setSeries((data ?? []) as Series[])
    }
    run()
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Series</h1>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button onClick={() => setView('grid')} className={clsx('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs', view === 'grid' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white')}>
            <LayoutGrid size={14} /> Grid
          </button>
          <button onClick={() => setView('list')} className={clsx('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs', view === 'list' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white')}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      <Tabs options={years} value={yearFilter} onChange={setYearFilter} />
      <Tabs options={langs.map((l) => l === 'All' ? 'All' : langLabel(l))} value={langFilter === 'All' ? 'All' : langLabel(langFilter)} onChange={(v) => setLangFilter(v === 'All' ? 'All' : langs.find((l) => langLabel(l) === v) ?? v)} />

      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered
            .filter(s => s.selected_poster_url)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/series/${s.id}`)}
                className="group text-left"
              >
                <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <img
                    src={s.selected_poster_url!}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="mt-2 line-clamp-1 text-xs font-semibold text-white/90">{s.title}</div>
              </button>
            ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Link key={s.id} to={`/series/${s.id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
              <div className="aspect-[2/3] w-16 overflow-hidden rounded-xl bg-white/5">
                {s.selected_poster_url ? <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.title}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                  {s.first_air_date ? <span>{s.first_air_date.slice(0, 4)}</span> : null}
                  {s.original_language ? <span>{langLabel(s.original_language)}</span> : null}
                </div>
                {s.overview ? <p className="mt-2 line-clamp-2 text-xs text-white/60">{s.overview}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!filtered.length ? <div className="text-sm text-white/50">No series found.</div> : null}
    </div>
  )
}
