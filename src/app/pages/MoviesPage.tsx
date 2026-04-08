import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import Masonry from '../ui/Masonry'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'

type Movie = {
  id: string
  title: string
  release_date: string | null
  runtime_minutes: number | null
  show_logo: boolean
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

export default function MoviesPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [movies, setMovies] = useState<Movie[]>([])
  const [yearFilter, setYearFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('movies')
        .select('id,title,release_date,runtime_minutes,show_logo,original_language,selected_poster_url,selected_logo_url,overview')
        .order('release_date', { ascending: false })
        .limit(300)
      if (!isMounted) return
      setMovies((data ?? []) as Movie[])
    }
    run()
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
  }), [movies, yearFilter, langFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Movies</h1>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button onClick={() => setView('grid')} className={clsx('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs', view === 'grid' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white')}>
            <LayoutGrid size={14} /> Grid
          </button>
          <button onClick={() => setView('list')} className={clsx('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs', view === 'list' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white')}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      <Tabs options={years} value={yearFilter} onChange={(v) => { setYearFilter(v) }} />
      <Tabs options={langs.map((l) => l === 'All' ? 'All' : langLabel(l))} value={langFilter === 'All' ? 'All' : langLabel(langFilter)} onChange={(v) => setLangFilter(v === 'All' ? 'All' : langs.find((l) => langLabel(l) === v) ?? v)} />

      {view === 'grid' ? (
        <Masonry
          items={filtered
            .filter(m => m.selected_poster_url)
            .map(m => ({ id: m.id, img: m.selected_poster_url!, url: `/movie/${m.id}`, height: 600 }))}
          animateFrom="bottom"
          stagger={0.03}
          blurToFocus
          scaleOnHover
          hoverScale={0.97}
          onItemClick={(id) => navigate(`/movie/${id}`)}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((movie) => (
            <Link key={movie.id} to={`/movie/${movie.id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
              <div className="aspect-[2/3] w-16 overflow-hidden rounded-xl bg-white/5">
                {movie.selected_poster_url ? <img src={movie.selected_poster_url} alt={movie.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{movie.title}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                  {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
                  {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
                  {movie.original_language ? <span>{langLabel(movie.original_language)}</span> : null}
                </div>
                {movie.overview ? <p className="mt-2 line-clamp-2 text-xs text-white/60">{movie.overview}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!filtered.length ? <div className="text-sm text-white/50">No movies found.</div> : null}
    </div>
  )
}
