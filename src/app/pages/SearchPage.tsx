import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePageMeta } from '../../lib/usePageMeta'

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
  usePageMeta({ title: q ? `Search: ${q}` : 'Search' })
  const [value, setValue] = useState(q)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [history, setHistory] = useState<string[]>(getHistory)
  const [focused, setFocused] = useState(false)
  const [dropdownResults, setDropdownResults] = useState<{ movies: Movie[]; series: Series[]; people: Person[] }>({ movies: [], series: [], people: [] })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setValue(q), [q])

  useEffect(() => {
    let isMounted = true
    const handle = setTimeout(async () => {
      const query = value.trim()
      if (!query) { setMovies([]); setSeries([]); setPeople([]); return }
      const [m, s, p] = await Promise.all([
        supabase.from('movies').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(24),
        supabase.from('series').select('id,title,selected_poster_url,selected_logo_url').ilike('title', `%${query}%`).limit(24),
        supabase.from('people').select('id,name,selected_profile_url').ilike('name', `%${query}%`).limit(12),
      ])
      if (!isMounted) return
      setMovies((m.data ?? []) as Movie[])
      setSeries((s.data ?? []) as Series[])
      setPeople((p.data ?? []) as Person[])
    }, 300)
    return () => { isMounted = false; clearTimeout(handle) }
  }, [value])

  useEffect(() => {
    let isMounted = true
    const handle = setTimeout(async () => {
      const query = value.trim()
      if (!query || !focused) { setDropdownResults({ movies: [], series: [], people: [] }); return }
      const [m, s, p] = await Promise.all([
        supabase.from('movies').select('id,title,selected_poster_url').ilike('title', `%${query}%`).limit(4),
        supabase.from('series').select('id,title,selected_poster_url').ilike('title', `%${query}%`).limit(3),
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
    addToHistory(t); setHistory(getHistory())
    setValue(t); setParams({ q: t })
    setFocused(false); inputRef.current?.blur()
  }

  const showDropdown = focused
  const hasDropdown = dropdownResults.movies.length + dropdownResults.series.length + dropdownResults.people.length > 0
  const resultCount = useMemo(() => movies.length + series.length + people.length, [movies, series, people])

  return (
    <div className="space-y-6">
      <h1 className="text-[28px] font-bold tracking-tight text-[var(--label)]">Search</h1>

      <div className="relative z-50">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-4 text-[var(--label3)] pointer-events-none" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setParams(e.target.value.trim() ? { q: e.target.value } : {}) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch(value)}
            placeholder="Movies, series, people…"
            className="w-full min-w-0 rounded-2xl border py-3.5 pl-11 pr-10 text-sm font-medium outline-none transition-colors focus:border-[var(--accent)]"
            style={{ background: 'var(--surface)', color: 'var(--label)', borderColor: 'var(--separator)' }}
          />
          {value && (
            <button onClick={() => { setValue(''); setParams({}); setMovies([]); setSeries([]); setPeople([]) }}
              className="absolute right-4 text-[var(--label3)] hover:text-[var(--label)] transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--separator)' }}>
            {!value.trim() ? (
              <div className="p-3 space-y-3">
                {history.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 pb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-[var(--label3)]">Recent</span>
                      <button onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]) }}
                        className="text-[10px] text-[var(--label3)] hover:text-[var(--label)]">Clear</button>
                    </div>
                    {history.slice(0, 5).map((term) => (
                      <button key={term} onMouseDown={() => submitSearch(term)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--surface2)] transition-colors">
                        <Clock size={12} className="text-[var(--label3)] shrink-0" />
                        <span className="flex-1 truncate text-sm text-[var(--label)]">{term}</span>
                        <span onMouseDown={(e) => { e.stopPropagation(); removeFromHistory(term); setHistory(getHistory()) }}
                          className="text-[var(--label3)] hover:text-[var(--label2)]"><X size={11} /></span>
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-[var(--label3)]">Trending</div>
                  <div className="flex flex-wrap gap-1.5 px-2">
                    {TRENDING.map((t) => (
                      <button key={t} onMouseDown={() => submitSearch(t)}
                        className="rounded-full px-3 py-1 text-xs text-[var(--label2)] hover:text-[var(--label)] transition-colors"
                        style={{ background: 'var(--surface2)' }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasDropdown ? (
              <div className="p-1.5 space-y-0.5 max-h-80 overflow-y-auto">
                {dropdownResults.movies.map((m) => (
                  <Link key={m.id} to={`/movie/${m.id}`} onMouseDown={() => submitSearch(m.title)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-[var(--surface2)] transition-colors">
                    <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg" style={{ background: 'var(--surface2)' }}>
                      {m.selected_poster_url && <img src={m.selected_poster_url} alt={m.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--label)]">{m.title}</div>
                      <div className="text-[10px] text-[var(--label2)]">Movie</div>
                    </div>
                  </Link>
                ))}
                {dropdownResults.series.map((s) => (
                  <Link key={s.id} to={`/series/${s.id}`} onMouseDown={() => submitSearch(s.title)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-[var(--surface2)] transition-colors">
                    <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg" style={{ background: 'var(--surface2)' }}>
                      {s.selected_poster_url && <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--label)]">{s.title}</div>
                      <div className="text-[10px] text-[var(--label2)]">Series</div>
                    </div>
                  </Link>
                ))}
                {dropdownResults.people.map((p) => (
                  <Link key={p.id} to={`/person/${p.id}`} onMouseDown={() => submitSearch(p.name)}
                    className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-[var(--surface2)] transition-colors">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--surface2)' }}>
                      {p.selected_profile_url && <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--label)]">{p.name}</div>
                      <div className="text-[10px] text-[var(--label2)]">Person</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-[var(--label2)]">No results for "{value}"</div>
            )}
          </div>
        )}
      </div>

      {q && <div className="text-xs text-[var(--label3)]">{resultCount} result{resultCount !== 1 ? 's' : ''} for "{q}"</div>}

      {movies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-[var(--label)]">Movies</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((m) => (
              <Link key={m.id} to={`/movie/${m.id}`} className="group relative overflow-hidden rounded-xl aspect-[2/3]" style={{ background: 'var(--surface)' }}>
                {m.selected_poster_url
                  ? <img src={m.selected_poster_url} alt={m.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-[var(--label3)]">{m.title}</div>}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2 line-clamp-2 text-[10px] font-semibold leading-tight text-[var(--label)]">{m.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-[var(--label)]">Series</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {series.map((s) => (
              <Link key={s.id} to={`/series/${s.id}`} className="group relative overflow-hidden rounded-xl aspect-[2/3]" style={{ background: 'var(--surface)' }}>
                {s.selected_poster_url
                  ? <img src={s.selected_poster_url} alt={s.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                  : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-[var(--label3)]">{s.title}</div>}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2 line-clamp-2 text-[10px] font-semibold leading-tight text-[var(--label)]">{s.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[17px] font-bold text-[var(--label)]">People</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {people.map((p) => (
              <Link key={p.id} to={`/person/${p.id}`}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-[var(--surface2)] transition-colors"
                style={{ background: 'var(--surface)' }}>
                <div className="h-10 w-10 overflow-hidden rounded-full shrink-0" style={{ background: 'var(--surface2)' }}>
                  {p.selected_profile_url && <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--label)]">{p.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!q && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Search size={36} className="text-[var(--label3)]" />
          <div className="text-sm text-[var(--label3)]">Search movies, series, and people</div>
        </div>
      )}
      {q && !resultCount && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <div className="text-sm font-semibold text-[var(--label2)]">No results for "{q}"</div>
          <div className="text-xs text-[var(--label3)]">Try a different title or name.</div>
        </div>
      )}
    </div>
  )
}
