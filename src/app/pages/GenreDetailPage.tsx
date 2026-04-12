import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import ContentGrid from '../ui/ContentGrid'

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
          <ContentGrid
            title={`Movies (${movies.length})`}
            items={movies.map((m) => ({
              id: m.id,
              title: m.title,
              to: `/movie/${m.id}`,
              imageUrl: m.selected_poster_url,
              badge: m.tmdb_rating ? `★ ${m.tmdb_rating}` : null,
              sub: [m.release_date?.slice(0, 4) ?? null, formatRuntime(m.runtime_minutes)].filter(Boolean).join(' · ') || null,
            }))}
            aspect="poster"
            showLogo={false}
          />
        </section>
      ) : null}

      {series.length ? (
        <section className="space-y-3">
          <ContentGrid
            title={`Series (${series.length})`}
            items={series.map((s) => ({
              id: s.id,
              title: s.title,
              to: `/series/${s.id}`,
              imageUrl: s.selected_poster_url,
              badge: s.tmdb_rating ? `★ ${s.tmdb_rating}` : null,
              sub: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
            }))}
            aspect="poster"
            showLogo={false}
          />
        </section>
      ) : null}

      {!movies.length && !series.length ? (
        <div className="text-sm text-white/50">No content in this genre yet.</div>
      ) : null}
    </div>
  )
}
