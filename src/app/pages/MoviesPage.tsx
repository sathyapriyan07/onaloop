import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Movie = {
  id: string; title: string; release_date: string | null
  original_language: string | null; selected_poster_url: string | null
  selected_logo_url: string | null; overview: string | null
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean',
}
const langLabel = (code: string) => LANG_NAMES[code] ?? code.toUpperCase()

function FilterRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={clsx(
            'shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors',
            o === value
              ? 'text-white' : 'text-white/50 hover:text-white/80',
          )}
          style={o === value ? { background: 'var(--surface2)' } : { background: 'var(--surface)' }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [yearFilter, setYearFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')

  useEffect(() => {
    let isMounted = true
    supabase.from('movies')
      .select('id,title,release_date,original_language,selected_poster_url,selected_logo_url,overview')
      .order('release_date', { ascending: false }).limit(300)
      .then(({ data }) => { if (isMounted) setMovies((data ?? []) as Movie[]) })
    return () => { isMounted = false }
  }, [])

  const years = useMemo(() => {
    const s = new Set(movies.map((m) => m.release_date?.slice(0, 4)).filter(Boolean) as string[])
    return ['All', ...Array.from(s).sort((a, b) => Number(b) - Number(a))]
  }, [movies])

  const langs = useMemo(() => {
    const s = new Set(movies.map((m) => m.original_language).filter(Boolean) as string[])
    return ['All', ...Array.from(s).sort()]
  }, [movies])

  const filtered = useMemo(() => movies.filter((m) => {
    if (yearFilter !== 'All' && m.release_date?.slice(0, 4) !== yearFilter) return false
    if (langFilter !== 'All' && m.original_language !== langFilter) return false
    return true
  }).filter(m => m.selected_poster_url), [movies, yearFilter, langFilter])

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-black tracking-tight">Movies</h1>

      <FilterRow options={years} value={yearFilter} onChange={setYearFilter} />
      <FilterRow
        options={langs.map((l) => l === 'All' ? 'All' : langLabel(l))}
        value={langFilter === 'All' ? 'All' : langLabel(langFilter)}
        onChange={(v) => setLangFilter(v === 'All' ? 'All' : langs.find((l) => langLabel(l) === v) ?? v)}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {filtered.map((m) => (
          <Link key={m.id} to={`/movie/${m.id}`}
            className="group relative overflow-hidden rounded-xl aspect-[2/3]"
            style={{ background: 'var(--surface)' }}>
            <img src={m.selected_poster_url!} alt={m.title} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2">
              {m.selected_logo_url
                ? <img src={m.selected_logo_url} alt="" className="max-h-6 max-w-[85%] object-contain object-left drop-shadow-md" loading="lazy" />
                : <div className="line-clamp-2 text-[10px] font-semibold leading-tight">{m.title}</div>}
            </div>
          </Link>
        ))}
      </div>

      {!filtered.length && <div className="py-20 text-center text-sm text-white/30">No movies found.</div>}
    </div>
  )
}
