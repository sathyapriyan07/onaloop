import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import PosterCard from '../ui/PosterCard'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'

type Movie = {
  id: string
  title: string
  release_date: string | null
  runtime_minutes: number | null
  selected_poster_url: string | null
  selected_logo_url: string | null
  overview: string | null
}

export default function MoviesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('movies')
        .select('id,title,release_date,runtime_minutes,selected_poster_url,selected_logo_url,overview')
        .order('release_date', { ascending: false })
        .limit(120)

      if (!isMounted) return
      setMovies((data ?? []) as Movie[])
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  const grid = useMemo(() => {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {movies.map((movie) => (
          <PosterCard
            key={movie.id}
            to={`/movie/${movie.id}`}
            title={movie.title}
            posterUrl={movie.selected_poster_url}
            logoUrl={movie.selected_logo_url}
          />
        ))}
      </div>
    )
  }, [movies])

  const list = useMemo(() => {
    return (
      <div className="space-y-3">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <div className="aspect-[2/3] w-16 overflow-hidden rounded-xl bg-white/5">
              {movie.selected_poster_url ? (
                <img src={movie.selected_poster_url} alt={movie.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{movie.title}</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/60">
                {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
                {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
              </div>
              {movie.overview ? <p className="mt-2 line-clamp-2 text-xs text-white/60">{movie.overview}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    )
  }, [movies])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Movies</h1>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setView('grid')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              view === 'grid' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white',
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              view === 'list' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white',
            )}
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>

      {view === 'grid' ? grid : list}
    </div>
  )
}

