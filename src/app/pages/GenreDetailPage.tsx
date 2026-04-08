import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'

type Genre = { id: string; name: string; display_image_url: string | null }
type Movie = { id: string; title: string; overview: string | null; release_date: string | null; runtime_minutes: number | null; tmdb_rating: number | null; selected_poster_url: string | null }
type Series = { id: string; title: string; overview: string | null; first_air_date: string | null; tmdb_rating: number | null; selected_poster_url: string | null }

export default function GenreDetailPage() {
  const { id } = useParams()
  const [genre, setGenre] = useState<Genre | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: g }, { data: mg }, { data: sg }] = await Promise.all([
        supabase.from('genres').select('id,name,display_image_url').eq('id', id).maybeSingle(),
        supabase.from('movie_genres').select('movie:movies(id,title,overview,release_date,runtime_minutes,tmdb_rating,selected_poster_url)').eq('genre_id', id),
        supabase.from('series_genres').select('series:series(id,title,overview,first_air_date,tmdb_rating,selected_poster_url)').eq('genre_id', id),
      ])
      if (!isMounted) return
      setGenre((g ?? null) as Genre | null)
      setMovies(((mg ?? []).map((r: any) => r.movie).filter(Boolean)) as Movie[])
      setSeries(((sg ?? []).map((r: any) => r.series).filter(Boolean)) as Series[])
    }
    run()
    return () => { isMounted = false }
  }, [id])

  if (!genre) return <div className="text-white/60">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="aspect-[21/6] w-full">
          {genre.display_image_url
            ? <img src={genre.display_image_url} alt={genre.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/0" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h1 className="text-2xl font-semibold tracking-tight">{genre.name}</h1>
        </div>
      </div>

      {movies.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Movies ({movies.length})</h2>
          <div className="space-y-2">
            {movies.map((m) => (
              <Link key={m.id} to={`/movie/${m.id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                <div className="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {m.selected_poster_url ? <img src={m.selected_poster_url} alt={m.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{m.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-white/50">
                    {m.release_date ? <span>{m.release_date.slice(0, 4)}</span> : null}
                    {formatRuntime(m.runtime_minutes) ? <span>{formatRuntime(m.runtime_minutes)}</span> : null}
                    {m.tmdb_rating ? <span>★ {m.tmdb_rating}</span> : null}
                  </div>
                  {m.overview ? <p className="mt-1 line-clamp-2 text-xs text-white/50">{m.overview}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {series.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Series ({series.length})</h2>
          <div className="space-y-2">
            {series.map((s) => (
              <Link key={s.id} to={`/series/${s.id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10">
                <div className="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                  {s.selected_poster_url ? <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{s.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-white/50">
                    {s.first_air_date ? <span>{s.first_air_date.slice(0, 4)}</span> : null}
                    {s.tmdb_rating ? <span>★ {s.tmdb_rating}</span> : null}
                  </div>
                  {s.overview ? <p className="mt-1 line-clamp-2 text-xs text-white/50">{s.overview}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!movies.length && !series.length ? (
        <div className="text-sm text-white/50">No content in this genre yet.</div>
      ) : null}
    </div>
  )
}
