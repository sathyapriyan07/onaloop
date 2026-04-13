import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, Clock, TrendingUp } from 'lucide-react'
import Input from '../ui/Input'
import PosterCard from '../ui/PosterCard'
import Expandable from '../ui/Expandable'
import { supabase } from '../../lib/supabase'

type Movie = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }
type Series = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }
type Person = { id: string; name: string; selected_profile_url: string | null }

const HISTORY_KEY = 'otl-search-history'
const MAX_HISTORY = 10
const TRENDING = ['Interstellar', 'Vikram', 'Oppenheimer', 'Leo', 'Dune']

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}
function addToHistory(term: string) {
  const prev = getHistory().filter((t) => t !== term)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([term, ...prev].slice(0, MAX_HISTORY)))
}
function removeFromHistory(term: string) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getHistory().filter((t) => t !== term)))
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const [value, setValue] = useState(q)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [history, setHistory] = useState<string[]>(getHistory)
  const [focused, setFocused] = useState(false)
  const [dropdownResults, setDropdownResults] = useState<{ movies: Movie[]; series: Series[]; people: Person[] }>({ movies: [], series: [], people: [] })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setValue(q), [q])

  // Full results (debounced)
  useEffect(() => {
    let isMounted = true
    const handle = setTimeout(async () => {
      const query = value.trim()
      if (!query) { setMovies([]); setSeries([]); setPeople([]); return }
      const [m, s, p] = await Promise.all([
        supabase.from('movies').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(24),
        supabase.from('series').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(24),
        supabase.from('people').select('id,name,selected_profile_url').ilike('name', `%${query}%`).limit(24),
      ])
      if (!isMounted) return
      setMovies((m.data ?? []) as Movie[])
      setSeries((s.data ?? []) as Series[])
      setPeople((p.data ?? []) as Person[])
    }, 300)
    return () => { isMounted = false; clearTimeout(handle) }
  }, [value])

  // Instant dropdown (faster, smaller limit)
  useEffect(() => {
    let isMounted = true
    const handle = setTimeout(async () => {
      const query = value.trim()
      if (!query || !focused) { setDropdownResults({ movies: [], series: [], people: [] }); return }
      const [m, s, p] = await Promise.all([
        supabase.from('movies').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(4),
        supabase.from('series').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(3),
        supabase.from('people').select('id,name,selected_profile_url').ilike('name', `%${query}%`).limit(3),
      ])
      if (!isMounted) return
      setDropdownResults({ movies: (m.data ?? []) as Movie[], series: (s.data ?? []) as Series[], people: (p.data ?? []) as Person[] })
    }, 150)
    return () => { isMounted = false; clearTimeout(handle) }
  }, [value, focused])

  function submitSearch(term: string) {
    const t = term.trim()
    if (!t) return
    addToHistory(t)
    setHistory(getHistory())
    setValue(t)
    setParams({ q: t })
    setFocused(false)
    inputRef.current?.blur()
  }

  function deleteHistory(term: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeFromHistory(term)
    setHistory(getHistory())
  }

  const showDropdown = focused
  const hasDropdownResults = dropdownResults.movies.length + dropdownResults.series.length + dropdownResults.people.length > 0
  const resultCount = useMemo(() => movies.length + series.length + people.length, [movies, series, people])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">Search</h1>
        <div className="relative z-50">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-white/40 pointer-events-none" />
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); setParams(e.target.value.trim() ? { q: e.target.value } : {}) }}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(value)}
              placeholder="Search movies, series, people…"
              className="pl-9 pr-9"
            />
            {value && (
              <button
                onClick={() => { setValue(''); setParams({}); setMovies([]); setSeries([]); setPeople([]) }}
                className="absolute right-3 text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Instant dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/8 shadow-2xl" style={{background:'#1a1a1a'}}>
              {!value.trim() ? (
                <div className="p-3 space-y-3">
                  {history.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-1 pb-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1"><Clock size={10} /> Recent</span>
                        <button onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]) }} className="text-[10px] text-white/30 hover:text-white">Clear</button>
                      </div>
                      {history.slice(0, 5).map((term) => (
                        <button key={term} onMouseDown={() => submitSearch(term)}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5 transition-colors">
                          <Clock size={13} className="text-white/30 shrink-0" />
                          <span className="flex-1 truncate text-sm">{term}</span>
                          <span onMouseDown={(e) => deleteHistory(term, e)} className="text-white/20 hover:text-white/60 transition-colors"><X size={12} /></span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div>
                    <div className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1"><TrendingUp size={10} /> Trending</div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {TRENDING.map((t) => (
                        <button key={t} onMouseDown={() => submitSearch(t)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10 hover:border-accent/40 transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : hasDropdownResults ? (
                <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
                  {dropdownResults.movies.map((m) => (
                    <Link key={m.id} to={`/movie/${m.id}`} onMouseDown={() => submitSearch(m.title)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors">
                      <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        {m.selected_poster_url && <img src={m.selected_poster_url} alt={m.title} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{m.title}</div>
                        <div className="text-[10px] text-white/40">Movie</div>
                      </div>
                    </Link>
                  ))}
                  {dropdownResults.series.map((s) => (
                    <Link key={s.id} to={`/series/${s.id}`} onMouseDown={() => submitSearch(s.title)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors">
                      <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        {s.selected_poster_url && <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        <div className="text-[10px] text-white/40">Series</div>
                      </div>
                    </Link>
                  ))}
                  {dropdownResults.people.map((p) => (
                    <Link key={p.id} to={`/person/${p.id}`} onMouseDown={() => submitSearch(p.name)}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition-colors">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                        {p.selected_profile_url && <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{p.name}</div>
                        <div className="text-[10px] text-white/40">Person</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-white/40">No results for "{value}"</div>
              )}
            </div>
          )}
        </div>
        {q ? <div className="text-xs text-white/40">{resultCount} result{resultCount !== 1 ? 's' : ''} for "{q}"</div> : null}
      </div>

      {movies.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">🎬 Movies</h2>
          <Expandable
            preview={<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{movies.slice(0, 6).map((m) => <PosterCard key={m.id} to={`/movie/${m.id}`} title={m.title} posterUrl={m.selected_poster_url} logoUrl={m.selected_logo_url} />)}</div>}
            label={`Show all ${movies.length}`}
            collapseLabel="Show less"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{movies.map((m) => <PosterCard key={m.id} to={`/movie/${m.id}`} title={m.title} posterUrl={m.selected_poster_url} logoUrl={m.selected_logo_url} />)}</div>
          </Expandable>
        </section>
      ) : null}

      {series.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">📺 Series</h2>
          <Expandable
            preview={<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{series.slice(0, 6).map((s) => <PosterCard key={s.id} to={`/series/${s.id}`} title={s.title} posterUrl={s.selected_poster_url} logoUrl={s.selected_logo_url} />)}</div>}
            label={`Show all ${series.length}`}
            collapseLabel="Show less"
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">{series.map((s) => <PosterCard key={s.id} to={`/series/${s.id}`} title={s.title} posterUrl={s.selected_poster_url} logoUrl={s.selected_logo_url} />)}</div>
          </Expandable>
        </section>
      ) : null}

      {people.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">👤 People</h2>
          <Expandable
            preview={
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {people.slice(0, 6).map((p) => (
                  <Link key={p.id} to={`/person/${p.id}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-colors" style={{background:'#161616'}}>
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-800 shrink-0">
                      {p.selected_profile_url ? <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-sm font-bold">{p.name}</div>
                  </Link>
                ))}
              </div>
            }
            label={`Show all ${people.length}`}
            collapseLabel="Show less"
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {people.map((p) => (
                <Link key={p.id} to={`/person/${p.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10 shrink-0">
                    {p.selected_profile_url ? <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</div>
                </Link>
              ))}
            </div>
          </Expandable>
        </section>
      ) : null}

      {!q && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Search size={32} className="text-white/20" />
          <div className="text-sm text-white/40">Type to search across movies, series, and people.</div>
        </div>
      )}
      {q && !resultCount ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="text-4xl">🔍</div>
          <div className="text-base font-semibold text-white/70">No results for "{q}"</div>
          <div className="text-sm text-white/40">Try a different title or name.</div>
        </div>
      ) : null}
    </div>
  )
}
