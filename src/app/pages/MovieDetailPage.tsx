import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TrailerHero from '../ui/TrailerHero'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import SpotlightCard from '../ui/SpotlightCard'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import { useSession } from '../../lib/useSession'

type Movie = {
  id: string
  title: string
  overview: string | null
  release_date: string | null
  runtime_minutes: number | null
  tmdb_rating: number | null
  trailer_url: string | null
  videos: Array<{ key: string; name: string; type: string }>
  selected_backdrop_url: string | null
  backdrop_images: unknown
  selected_logo_url: string | null
  title_logos: unknown
  selected_poster_url: string | null
  tags: string[]
}

type Genre = { id: string; name: string }
type Review = { id: string; user_id: string; rating: number | null; review_text: string; created_at: string; profile: { email: string | null } | null }
type LinkRow = { id: string; label: string; url: string; platform?: { name: string; logo_url: string | null } | null }
type CreditRow = {
  id: string
  credit_type: 'cast' | 'crew'
  character: string | null
  job: string | null
  sort_order: number
  person: { id: string; name: string; selected_profile_url: string | null } | null
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [similarMovies, setSimilarMovies] = useState<Array<{ id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null; tmdb_rating: number | null }>>([])  

  useEffect(() => {
    let isMounted = true
    async function run() {
      if (!id) return

      const { data: movieRow } = await supabase
        .from('movies')
        .select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,videos,selected_backdrop_url,backdrop_images,selected_logo_url,title_logos,selected_poster_url,tags')
        .eq('id', id)
        .maybeSingle()
      if (!isMounted) return
      setMovie((movieRow ?? null) as Movie | null)

      const { data: genreRows } = await supabase
        .from('movie_genres').select('genre:genres(id,name)').eq('movie_id', id)
      if (!isMounted) return
      const fetchedGenres = ((genreRows ?? []).map((r: any) => r.genre).filter(Boolean)) as Genre[]
      setGenres(fetchedGenres)

      if (fetchedGenres.length >= 2) {
        const genreIds = fetchedGenres.map((g) => g.id)
        const { data: simRows } = await supabase
          .from('movie_genres')
          .select('movie_id,genre_id,movie:movies(id,title,selected_poster_url,selected_logo_url,tmdb_rating)')
          .in('genre_id', genreIds)
          .neq('movie_id', id)
        if (isMounted) {
          // count genre matches per movie
          const countMap = new Map<string, number>()
          const movieMap = new Map<string, any>()
          for (const row of (simRows ?? []) as any[]) {
            const movie = Array.isArray(row.movie) ? row.movie[0] : row.movie
            if (!movie) continue
            countMap.set(movie.id, (countMap.get(movie.id) ?? 0) + 1)
            movieMap.set(movie.id, movie)
          }
          const sim = [...movieMap.values()]
            .filter((m) => (countMap.get(m.id) ?? 0) >= 2)
            .sort((a, b) => (b.tmdb_rating ?? 0) - (a.tmdb_rating ?? 0))
            .slice(0, 12)
          setSimilarMovies(sim)
        }
      }

      const { data: creditRows } = await supabase
        .from('credits')
        .select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)')
        .eq('movie_id', id)
        .order('sort_order', { ascending: true })
      if (!isMounted) return
      setCredits((creditRows ?? []) as unknown as CreditRow[])

      const { data: reviewRows } = await supabase
        .from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)')
        .eq('movie_id', id).order('created_at', { ascending: false })
      if (!isMounted) return
      setReviews((reviewRows ?? []) as unknown as Review[])

      const { data: musicRows } = await supabase
        .from('movie_music_links').select('id,label,url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order')
      if (!isMounted) return
      setMusicLinks((musicRows ?? []) as unknown as LinkRow[])

      const { data: streamingRows } = await supabase
        .from('movie_streaming_links').select('id,label,url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order')
      if (!isMounted) return
      setStreamingLinks((streamingRows ?? []) as unknown as LinkRow[])
    }
    run()
    return () => { isMounted = false }
  }, [id])

  async function submitReview() {
    if (!id || !user || !reviewText.trim()) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({ user_id: user.id, movie_id: id, review_text: reviewText.trim() })
      if (error) throw error
      setReviewText('')
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)').eq('movie_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!movie) return <div className="text-white/60">Loading…</div>

  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const videos = (movie.videos ?? []) as Array<{ key: string; name: string; type: string }>

  return (
    <div className="space-y-6">
      <TrailerHero
        title={movie.title}
        trailerUrl={movie.trailer_url}
        backdropUrl={movie.selected_backdrop_url}
        backdropImages={movie.backdrop_images}
      />

      <section className="space-y-2">
        {movie.selected_logo_url
          ? <img src={movie.selected_logo_url} alt={movie.title} className="max-h-14 w-auto max-w-[60%] object-contain" />
          : <h1 className="text-xl font-semibold tracking-tight">{movie.title}</h1>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
          {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
          {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
          {movie.tmdb_rating ? <span className="flex items-center gap-1">★ {movie.tmdb_rating}</span> : null}
          {genres.length ? <span>{genres.map((g) => g.name).join(' · ')}</span> : null}
        </div>
        {movie.overview ? <p className="text-sm leading-relaxed text-white/70">{movie.overview}</p> : null}
        {movie.tags?.length ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {movie.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {streamingLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Streaming</h2>
          <div className="flex flex-wrap gap-2">
            {streamingLinks.map((l) => {
              const logo = (l.platform as any)?.logo_url
              const name = (l.platform as any)?.name ?? l.label
              return (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors"
                  title={name}>
                  {logo
                    ? <img src={logo} alt={name} className="h-5 w-auto max-w-[80px] object-contain" />
                    : <span className="text-sm">{name}</span>}
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {musicLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Music</h2>
          <div className="flex flex-wrap gap-2">
            {musicLinks.map((l) => {
              const logo = (l.platform as any)?.logo_url
              const name = (l.platform as any)?.name ?? l.label
              return (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors"
                  title={name}>
                  {logo
                    ? <img src={logo} alt={name} className="h-5 w-auto max-w-[80px] object-contain" />
                    : <span className="text-sm">{name}</span>}
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {cast.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Cast</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cast.map((c) => c.person && (
              <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
                  {c.person.selected_profile_url
                    ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
                </div>
                <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
                {c.character ? <div className="w-full truncate text-xs text-white/50">{c.character}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {crew.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Crew</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {crew.map((c) => c.person && (
              <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
                  {c.person.selected_profile_url
                    ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
                </div>
                <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
                {c.job ? <div className="w-full truncate text-xs text-white/50">{c.job}</div> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {videos.length > 1 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Videos</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {videos.map((v) => (
              <button
                key={v.key}
                onClick={() => setActiveVideo(activeVideo === v.key ? null : v.key)}
                className={['shrink-0 rounded-2xl border overflow-hidden text-left transition-colors', activeVideo === v.key ? 'border-white' : 'border-white/10 bg-white/5 hover:bg-white/10'].join(' ')}
              >
                <div className="relative">
                  <img
                    src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`}
                    alt={v.name}
                    className="h-24 w-40 object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-950 text-sm">▶</div>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <div className="w-40 truncate text-xs font-medium">{v.name}</div>
                  <div className="text-xs text-white/40">{v.type}</div>
                </div>
              </button>
            ))}
          </div>
          {activeVideo ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                className="h-full w-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title="Video"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      {similarMovies.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Similar Movies</h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarMovies.map((m) => (
              <Link key={m.id} to={`/movie/${m.id}`} className="group relative block aspect-[2/3] w-[30vw] max-w-[140px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {m.selected_poster_url
                  ? <img src={m.selected_poster_url} alt={m.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  : <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/50">{m.title}</div>}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <div className="line-clamp-2 text-xs font-semibold">{m.title}</div>
                </div>
                {m.tmdb_rating ? (
                  <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold">★ {m.tmdb_rating}</div>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Reviews</h2>
        {user ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <div className="flex justify-end">
              <Button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}>Post review</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">Log in to add a review.</div>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <SpotlightCard key={r.id} className="p-4" spotlightColor="rgba(255,255,255,0.06)">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white/70">{(r.profile as any)?.email ?? 'Anonymous'}</div>
                <div className="text-xs text-white/40">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-sm text-white/80">{r.review_text}</div>
            </SpotlightCard>
          ))}
          {!reviews.length ? <div className="text-sm text-white/50">No reviews yet.</div> : null}
        </div>
      </section>
    </div>
  )
}
