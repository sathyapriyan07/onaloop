import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PosterGridSkeleton from '../ui/PosterGridSkeleton'
import { usePageMeta } from '../../lib/usePageMeta'

type Series = {
  id: string; title: string; first_air_date: string | null
  original_language: string | null; selected_poster_url: string | null
  selected_logo_url: string | null
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean',
}
const langLabel = (code: string) => LANG_NAMES[code] ?? code.toUpperCase()

function FilterRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="snap-x-rail touch-pan-x flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={clsx('otl-chip')}
          data-active={o === value}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function SeriesPage() {
  usePageMeta({ title: 'Series' })
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')

  useEffect(() => {
    let isMounted = true
    supabase.from('series')
      .select('id,title,first_air_date,original_language,selected_poster_url,selected_logo_url')
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
  }).filter(s => s.selected_poster_url), [series, yearFilter, langFilter])

  return (
    <div className="space-y-5">
      <h1 className="otl-title text-[var(--label)]">Series</h1>

      <FilterRow options={years} value={yearFilter} onChange={setYearFilter} />
      <FilterRow
        options={langs.map((l) => l === 'All' ? 'All' : langLabel(l))}
        value={langFilter === 'All' ? 'All' : langLabel(langFilter)}
        onChange={(v) => setLangFilter(v === 'All' ? 'All' : langs.find((l) => langLabel(l) === v) ?? v)}
      />

      {loading ? <PosterGridSkeleton count={18} /> : (
        <div className="w-[965px] max-w-full mx-auto grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {filtered.map((s) => (
            <Link key={s.id} to={`/series/${s.id}`}
              className="otl-card aspect-[193/256]">
              <img src={s.selected_poster_url!} alt={s.title}
                className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                {s.selected_logo_url
                  ? <img src={s.selected_logo_url} alt="" className="max-h-6 max-w-[85%] object-contain object-left drop-shadow-md" />
                  : <div className="line-clamp-2 text-[10px] font-semibold leading-tight text-[var(--label)]">{s.title}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !filtered.length && <div className="py-20 text-center text-sm text-[var(--label3)]">No series found.</div>}
    </div>
  )
}
