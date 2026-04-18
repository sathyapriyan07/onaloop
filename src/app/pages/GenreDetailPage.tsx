import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import ContentGrid from '../ui/ContentGrid'
import PosterGridSkeleton from '../ui/PosterGridSkeleton'

type Genre = { id: string; name: string; display_image_url: string | null }
type Movie = { id: string; title: string; release_date: string | null; runtime_minutes: number | null; tmdb_rating: number | null; selected_poster_url: string | null }
type Series = { id: string; title: string; first_air_date: string | null; tmdb_rating: number | null; selected_poster_url: string | null }

export default function GenreDetailPage() {
  const { id } = useParams()
  const [genre, setGenre] = useState<Genre | null>(null)
  const [movies, setMovies] = useState<Movie[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    Promise.all([
      supabase.from('genres').select('id,name,display_image_url').eq('id', id).maybeSingle(),
      supabase.from('movie_genres').select('movie:movies(id,title,release_date,runtime_minutes,tmdb_rating,selected_poster_url)').eq('genre_id', id),
      supabase.from('series_genres').select('series:series(id,title,first_air_date,tmdb_rating,selected_poster_url)').eq('genre_id', id),
    ]).then(([{ data: g }, { data: mg }, { data: sg }]) => {
      if (!isMounted) return
      setGenre((g ?? null) as Genre | null)
      setMovies(((mg ?? []).map((r: any) => r.movie).filter(Boolean)) as Movie[])
      setSeries(((sg ?? []).map((r: any) => r.series).filter(Boolean)) as Series[])
      setLoading(false)
    })
    return () => { isMounted = false }
  }, [id])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl" style={{ background: '#161616' }}>
        <div className="aspect-[16/9] w-full md:aspect-[21/6]">
          {genre?.display_image_url
            ? <img src={genre.display_image_url} alt={genre.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full" style={{ background: '#1a1a1a' }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          {loading
            ? <div className="h-7 w-32 skeleton rounded-lg" />
            : <h1 className="text-2xl font-bold tracking-tight">{genre?.name}</h1>}
        </div>
      </div>

      {loading ? (
        <PosterGridSkeleton count={12} />
      ) : (
        <>
          {movies.length ? (
            <ContentGrid
              title={`Movies (${movies.length})`}
              items={movies.map((m) => ({
                id: m.id, title: m.title, to: `/movie/${m.id}`,
                imageUrl: m.selected_poster_url,
                badge: m.tmdb_rating ? `${m.tmdb_rating}` : null,
                sub: [m.release_date?.slice(0, 4) ?? null, formatRuntime(m.runtime_minutes)].filter(Boolean).join(' · ') || null,
              }))}
              aspect="poster" showLogo={false}
            />
          ) : null}

          {series.length ? (
            <ContentGrid
              title={`Series (${series.length})`}
              items={series.map((s) => ({
                id: s.id, title: s.title, to: `/series/${s.id}`,
                imageUrl: s.selected_poster_url,
                badge: s.tmdb_rating ? `${s.tmdb_rating}` : null,
                sub: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
              }))}
              aspect="poster" showLogo={false}
            />
          ) : null}

          {!movies.length && !series.length ? (
            <div className="text-sm text-white/40 text-center py-10">No content in this genre yet.</div>
          ) : null}
        </>
      )}
    </div>
  )
}
