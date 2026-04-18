import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import clsx from 'clsx'
import { usePageMeta } from '../../lib/usePageMeta'

type Movie = { id: string; title: string; release_date: string | null; original_language: string | null; selected_poster_url: string | null; tmdb_rating: number | null }
type Series = { id: string; title: string; first_air_date: string | null; original_language: string | null; selected_poster_url: string | null; tmdb_rating: number | null }
type Genre = { id: string; name: string }
type Platform = { id: string; name: string; logo_url: string | null }

const LANG_NAMES: Record<string, string> = {
  en: 'English', ml: 'Malayalam', hi: 'Hindi', ta: 'Tamil', te: 'Telugu',
  kn: 'Kannada', fr: 'French', es: 'Spanish', ja: 'Japanese', ko: 'Korean',
}
const REGIONAL = ['ta', 'ml', 'hi', 'te', 'kn']

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={clsx('shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors',
        active ? 'text-white' : 'text-[var(--label2)] hover:text-[var(--label)]')}
      style={active ? { background: 'var(--accent)' } : { background: 'var(--surface)' }}>
      {children}
    </button>
  )
}

export default function DiscoverPage() {
  usePageMeta({ title: 'Discover' })
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [movieGenreMap, setMovieGenreMap] = useState<Map<string, string[]>>(new Map())
  const [seriesGenreMap, setSeriesGenreMap] = useState<Map<string, string[]>>(new Map())
  const [moviePlatformMap, setMoviePlatformMap] = useState<Map<string, string[]>>(new Map())

  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all')
  const [genreFilter, setGenreFilter] = useState<string | null>(null)
  const [langFilter, setLangFilter] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [yearFilter, setYearFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('movies').select('id,title,release_date,original_language,selected_poster_url,tmdb_rating').order('release_date', { ascending: false }).limit(500),
      supabase.from('series').select('id,title,first_air_date,original_language,selected_poster_url,tmdb_rating').order('first_air_date', { ascending: false }).limit(500),
      supabase.from('genres').select('id,name').order('name'),
      supabase.from('platforms').select('id,name,logo_url').order('name'),
      supabase.from('movie_genres').select('movie_id,genre_id'),
      supabase.from('series_genres').select('series_id,genre_id'),
      supabase.from('movie_platforms').select('movie_id,platform_id'),
    ]).then(([m, s, g, p, mg, sg, mp]) => {
      setMovies((m.data ?? []) as Movie[])
      setSeries((s.data ?? []) as Series[])
      setGenres((g.data ?? []) as Genre[])
      setPlatforms((p.data ?? []) as Platform[])
      const mgMap = new Map<string, string[]>()
      for (const r of (mg.data ?? []) as any[]) { if (!mgMap.has(r.movie_id)) mgMap.set(r.movie_id, []); mgMap.get(r.movie_id)!.push(r.genre_id) }
      setMovieGenreMap(mgMap)
      const sgMap = new Map<string, string[]>()
      for (const r of (sg.data ?? []) as any[]) { if (!sgMap.has(r.series_id)) sgMap.set(r.series_id, []); sgMap.get(r.series_id)!.push(r.genre_id) }
      setSeriesGenreMap(sgMap)
      const mpMap = new Map<string, string[]>()
      for (const r of (mp.data ?? []) as any[]) { if (!mpMap.has(r.movie_id)) mpMap.set(r.movie_id, []); mpMap.get(r.movie_id)!.push(r.platform_id) }
      setMoviePlatformMap(mpMap)
    })
  }, [])

  const years = useMemo(() => {
    const s = new Set([...movies.map((m) => m.release_date?.slice(0, 4)), ...series.map((s) => s.first_air_date?.slice(0, 4))].filter(Boolean) as string[])
    return Array.from(s).sort((a, b) => Number(b) - Number(a))
  }, [movies, series])

  const langs = useMemo(() => {
    const s = new Set([...movies.map((m) => m.original_language), ...series.map((s) => s.original_language)].filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [movies, series])

  type ResultItem = { id: string; title: string; to: string; posterUrl: string | null; rating: number | null; year: string | null; type: 'movie' | 'series' }

  const results = useMemo((): ResultItem[] => {
    const items: ResultItem[] = []
    if (typeFilter !== 'series') {
      for (const m of movies) {
        if (langFilter && m.original_language !== langFilter) continue
        if (yearFilter && m.release_date?.slice(0, 4) !== yearFilter) continue
        if (genreFilter && !movieGenreMap.get(m.id)?.includes(genreFilter)) continue
        if (platformFilter && !moviePlatformMap.get(m.id)?.includes(platformFilter)) continue
        items.push({ id: m.id, title: m.title, to: `/movie/${m.id}`, posterUrl: m.selected_poster_url, rating: m.tmdb_rating, year: m.release_date?.slice(0, 4) ?? null, type: 'movie' })
      }
    }
    if (typeFilter !== 'movie') {
      for (const s of series) {
        if (langFilter && s.original_language !== langFilter) continue
        if (yearFilter && s.first_air_date?.slice(0, 4) !== yearFilter) continue
        if (genreFilter && !seriesGenreMap.get(s.id)?.includes(genreFilter)) continue
        items.push({ id: s.id, title: s.title, to: `/series/${s.id}`, posterUrl: s.selected_poster_url, rating: s.tmdb_rating, year: s.first_air_date?.slice(0, 4) ?? null, type: 'series' })
      }
    }
    return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }, [movies, series, typeFilter, genreFilter, langFilter, platformFilter, yearFilter, movieGenreMap, seriesGenreMap, moviePlatformMap])

  const activeFilterCount = [genreFilter, langFilter, platformFilter, yearFilter].filter(Boolean).length
  function clearAll() { setGenreFilter(null); setLangFilter(null); setPlatformFilter(null); setYearFilter(null); setTypeFilter('all') }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black tracking-tight text-[var(--label)]">Discover</h1>
          <p className="text-xs text-[var(--label3)] mt-0.5">{results.length} titles</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-[var(--label2)] hover:text-[var(--label)] transition-colors">
              <X size={11} /> Clear
            </button>
          )}
          <button onClick={() => setShowFilters((v) => !v)}
            className={clsx('flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors',
              showFilters || activeFilterCount > 0 ? 'text-white' : 'text-[var(--label2)] hover:text-[var(--label)]')}
            style={showFilters || activeFilterCount > 0 ? { background: 'var(--accent)' } : { background: 'var(--surface)' }}>
            <SlidersHorizontal size={12} />
            Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {(['all', 'movie', 'series'] as const).map((t) => (
          <Pill key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Series'}
          </Pill>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {REGIONAL.filter((l) => langs.includes(l)).map((l) => (
          <Pill key={l} active={langFilter === l} onClick={() => setLangFilter(langFilter === l ? null : l)}>
            {LANG_NAMES[l] ?? l}
          </Pill>
        ))}
      </div>

      {showFilters && (
        <div className="space-y-4 rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--label3)]">Genre</div>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <Pill key={g.id} active={genreFilter === g.id} onClick={() => setGenreFilter(genreFilter === g.id ? null : g.id)}>{g.name}</Pill>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--label3)]">Language</div>
            <div className="flex flex-wrap gap-1.5">
              {langs.map((l) => (
                <Pill key={l} active={langFilter === l} onClick={() => setLangFilter(langFilter === l ? null : l)}>{LANG_NAMES[l] ?? l.toUpperCase()}</Pill>
              ))}
            </div>
          </div>
          {platforms.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--label3)]">Platform</div>
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <button key={p.id} onClick={() => setPlatformFilter(platformFilter === p.id ? null : p.id)}
                    className={clsx('flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-colors',
                      platformFilter === p.id ? 'text-white' : 'text-[var(--label2)] hover:text-[var(--label)]')}
                    style={platformFilter === p.id ? { background: 'var(--accent)' } : { background: 'var(--surface2)' }}>
                    {p.logo_url && <img src={p.logo_url} alt={p.name} className="h-3 w-auto max-w-[32px] object-contain" />}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--label3)]">Year</div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {years.map((y) => (
                <Pill key={y} active={yearFilter === y} onClick={() => setYearFilter(yearFilter === y ? null : y)}>{y}</Pill>
              ))}
            </div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <div className="text-sm text-[var(--label2)]">No results match your filters.</div>
          <button onClick={clearAll} className="text-xs text-accent hover:opacity-80">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {results.map((item) => (
            <Link key={`${item.type}-${item.id}`} to={item.to}
              className="group relative overflow-hidden rounded-xl aspect-[2/3]"
              style={{ background: 'var(--surface)' }}>
              {item.posterUrl
                ? <img src={item.posterUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-[var(--label3)]">{item.title}</div>}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <div className="line-clamp-2 text-[10px] font-semibold leading-tight text-[var(--label)]">{item.title}</div>
                {(item.rating || item.year) && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-[var(--label2)]">
                    {item.rating ? <span>★ {item.rating}</span> : null}
                    {item.year ? <span>{item.year}</span> : null}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
