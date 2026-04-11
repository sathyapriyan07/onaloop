import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Input from '../ui/Input'
import PosterCard from '../ui/PosterCard'
import { supabase } from '../../lib/supabase'

type Movie = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }
type Series = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }
type Person = { id: string; name: string; selected_profile_url: string | null }

const HISTORY_KEY = 'otl-search-history'
const MAX_HISTORY = 10

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setValue(q), [q])

  useEffect(() => {
    let isMounted = true
    const handle = setTimeout(async () => {
      const query = value.trim()
      if (!query) {
        if (!isMounted) return
        setMovies([]); setSeries([]); setPeople([])
        return
      }

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') submitSearch(value)
  }

  function deleteHistory(term: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeFromHistory(term)
    setHistory(getHistory())
  }

  const showHistory = focused && !value.trim() && history.length > 0
  const resultCount = useMemo(() => movies.length + series.length + people.length, [movies, series, people])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Search</h1>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setParams(e.target.value.trim() ? { q: e.target.value } : {}) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, series, people…"
          />
          {showHistory && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-xl">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-white/40">Recent searches</span>
                <button onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]) }} className="text-xs text-white/40 hover:text-white">Clear all</button>
              </div>
              {history.map((term) => (
                <button key={term} onMouseDown={() => submitSearch(term)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5">
                  <span className="material-icons-round text-white/30" style={{ fontSize: 16 }}>history</span>
                  <span className="flex-1 truncate text-sm">{term}</span>
                  <span onMouseDown={(e) => deleteHistory(term, e)} className="material-icons-round text-white/30 hover:text-white/70" style={{ fontSize: 16 }}>close</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {q ? <div className="text-xs text-white/50">{resultCount} results</div> : null}
      </div>

      {movies.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Movies</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {movies.map((m) => (
              <PosterCard
                key={m.id}
                to={`/movie/${m.id}`}
                title={m.title}
                posterUrl={m.selected_poster_url}
                logoUrl={m.selected_logo_url}
              />
            ))}
          </div>
        </section>
      ) : null}

      {series.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Series</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {series.map((s) => (
              <PosterCard
                key={s.id}
                to={`/series/${s.id}`}
                title={s.title}
                posterUrl={s.selected_poster_url}
                logoUrl={s.selected_logo_url}
              />
            ))}
          </div>
        </section>
      ) : null}

      {people.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">People</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {people.map((p) => (
              <Link
                key={p.id}
                to={`/person/${p.id}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
              >
                <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/10">
                  {p.selected_profile_url ? (
                    <img src={p.selected_profile_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!q ? <div className="text-sm text-white/60">Type to search across movies, series, and people.</div> : null}
      {q && !resultCount ? <div className="text-sm text-white/60">No results.</div> : null}
    </div>
  )
}

