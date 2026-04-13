import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
import TrailerModal from '../ui/TrailerModal'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import SpotlightCard from '../ui/SpotlightCard'
import Gallery from '../ui/Gallery'
import Expandable from '../ui/Expandable'
import ContentGrid from '../ui/ContentGrid'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import { useSession } from '../../lib/useSession'
import { useUserContent } from '../../lib/useUserContent'

type Movie = {
  id: string; title: string; overview: string | null; release_date: string | null
  runtime_minutes: number | null; tmdb_rating: number | null; trailer_url: string | null
  selected_backdrop_url: string | null; backdrop_images: unknown; selected_logo_url: string | null
  title_logos: unknown; selected_poster_url: string | null; tags: string[]
  budget: string | null; collection: string | null; gallery_images: string[]
  imdb_rating: number | null; rotten_tomatoes_rating: number | null; loop_score: number | null
}
type Genre = { id: string; name: string }
type Review = { id: string; user_id: string; rating: number | null; review_text: string; created_at: string; profile: { email: string | null } | null }
type LinkRow = { id: string; label: string; url: string; platform?: { name: string; logo_url: string | null } | null }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }

function extractYouTubeId(url: string) {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return m?.[1] ?? null
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}>
          <Star size={18} className={n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
        </button>
      ))}
    </div>
  )
}

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const { inWatchlist, isWatched, toggleWatchlist, toggleWatched } = useUserContent(id, 'movie')
  const [movie, setMovie] = useState<Movie | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [similarMovies, setSimilarMovies] = useState<any[]>([])
  const [studios, setStudios] = useState<{ id: string; name: string; logo_url: string | null }[]>([])
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: movieRow }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: musicRows }, { data: streamingRows }, { data: studioRows }] = await Promise.all([
        supabase.from('movies').select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,selected_backdrop_url,backdrop_images,selected_logo_url,title_logos,selected_poster_url,tags,budget,collection,gallery_images,imdb_rating,rotten_tomatoes_rating,loop_score').eq('id', id).maybeSingle(),
        supabase.from('movie_genres').select('genre:genres(id,name)').eq('movie_id', id),
        supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('movie_id', id).order('sort_order', { ascending: true }),
        supabase.from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)').eq('movie_id', id).order('created_at', { ascending: false }),
        supabase.from('movie_music_links').select('id,label,url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order'),
        supabase.from('movie_streaming_links').select('id,label,url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order'),
        supabase.from('movie_production_houses').select('production_house:production_houses(id,name,logo_url)').eq('movie_id', id),
      ])
      if (!isMounted) return
      setMovie((movieRow ?? null) as Movie | null)
      const fetchedGenres = ((genreRows ?? []).map((r: any) => r.genre).filter(Boolean)) as Genre[]
      setGenres(fetchedGenres)
      setCredits((creditRows ?? []) as unknown as CreditRow[])
      setReviews((reviewRows ?? []) as unknown as Review[])
      setMusicLinks((musicRows ?? []) as unknown as LinkRow[])
      setStreamingLinks((streamingRows ?? []) as unknown as LinkRow[])
      setStudios(((studioRows ?? []) as any[]).map((r) => Array.isArray(r.production_house) ? r.production_house[0] : r.production_house).filter(Boolean))

      if (fetchedGenres.length >= 1) {
        const { data: simRows } = await supabase.from('movie_genres').select('movie_id,genre_id,movie:movies(id,title,selected_poster_url,selected_logo_url,tmdb_rating)').in('genre_id', fetchedGenres.map((g) => g.id)).neq('movie_id', id)
        if (isMounted) {
          const countMap = new Map<string, number>()
          const movieMap = new Map<string, any>()
          for (const row of (simRows ?? []) as any[]) {
            const m = Array.isArray(row.movie) ? row.movie[0] : row.movie
            if (!m) continue
            countMap.set(m.id, (countMap.get(m.id) ?? 0) + 1)
            movieMap.set(m.id, m)
          }
          setSimilarMovies([...movieMap.values()].sort((a, b) => (b.tmdb_rating ?? 0) - (a.tmdb_rating ?? 0)).slice(0, 12))
        }
      }
    }
    run()
    return () => { isMounted = false }
  }, [id])

  async function submitReview() {
    if (!id || !user || !reviewText.trim()) return
    setIsSubmitting(true)
    try {
      await supabase.from('reviews').upsert({ user_id: user.id, movie_id: id, review_text: reviewText.trim(), rating: reviewRating || null }, { onConflict: 'user_id,movie_id' })
      setReviewText(''); setReviewRating(0)
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)').eq('movie_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally { setIsSubmitting(false) }
  }

  if (!movie) return <div className="text-white/40 text-sm">Loading…</div>

  const videoId = movie.trailer_url ? extractYouTubeId(movie.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const avgRating = reviews.filter((r) => r.rating).length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.filter((r) => r.rating).length).toFixed(1)
    : null

  return (
    <div className="space-y-6">
      {/* Backdrop hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
          {movie.selected_backdrop_url
            ? <img src={movie.selected_backdrop_url} alt={movie.title} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-accent/20 via-white/5 to-transparent" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 space-y-3">
            {movie.selected_logo_url
              ? <img src={movie.selected_logo_url} alt={movie.title} className="max-h-16 w-auto max-w-[60%] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" />
              : <h1 className="text-2xl font-black tracking-tight">{movie.title}</h1>
            }
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
              {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
              {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
              {movie.tmdb_rating ? <span className="flex items-center gap-1">★ {movie.tmdb_rating}</span> : null}
              {movie.loop_score != null ? <span className="text-accent font-semibold">🔁 {movie.loop_score}</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {videoId && (
                <button onClick={() => setShowTrailer(true)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90" style={{ background: 'var(--accent)' }}>
                  <Play size={14} fill="currentColor" /> Watch Trailer
                </button>
              )}
              <button onClick={toggleWatchlist} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${inWatchlist ? 'border-accent bg-accent/15 text-accent' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
                {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>
              <button onClick={toggleWatched} className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${isWatched ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
                {isWatched ? <Eye size={14} /> : <EyeOff size={14} />}
                {isWatched ? 'Watched' : 'Mark Watched'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Meta */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {movie.imdb_rating ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <img src="/IMDB_Logo_2016.svg.png" alt="IMDb" className="h-3 w-auto" /> {movie.imdb_rating}
            </span>
          ) : null}
          {movie.rotten_tomatoes_rating ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <img src="/Rotten_Tomatoes.svg.png" alt="RT" className="h-3 w-auto" /> {movie.rotten_tomatoes_rating}%
            </span>
          ) : null}
          {avgRating ? (
            <span className="flex items-center gap-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-400">
              ★ {avgRating} community
            </span>
          ) : null}
        </div>

        {/* Clickable genre pills */}
        {genres.length ? (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <Link key={g.id} to={`/genre/${g.id}`} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 hover:border-accent/50 hover:text-accent transition-colors">
                {g.name}
              </Link>
            ))}
          </div>
        ) : null}

        {studios.length ? (
          <div className="flex flex-wrap gap-2">
            {studios.map((s) => (
              <Link key={s.id} to={`/studio/${s.id}`} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition-colors">
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-4 w-auto max-w-[40px] object-contain" /> : null}
                <span className="text-xs font-medium">{s.name}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {movie.overview ? (
          <Expandable preview={<p className="text-sm leading-relaxed text-white/70 line-clamp-3">{movie.overview}</p>} label="Read more" collapseLabel="Show less">
            <p className="text-sm leading-relaxed text-white/70">{movie.overview}</p>
          </Expandable>
        ) : null}

        {(movie.tags ?? []).length ? (
          <div className="flex flex-wrap gap-1.5">
            {(movie.tags ?? []).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">{tag}</span>
            ))}
          </div>
        ) : null}

        {(movie.budget || movie.collection) ? (
          <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            {movie.budget ? <div className="space-y-0.5"><div className="text-[10px] uppercase tracking-wider text-white/40">Budget</div><div className="text-sm font-semibold">{movie.budget}</div></div> : null}
            {movie.budget && movie.collection ? <div className="w-px bg-white/10" /> : null}
            {movie.collection ? <div className="space-y-0.5"><div className="text-[10px] uppercase tracking-wider text-white/40">Collection</div><div className="text-sm font-semibold text-green-400">{movie.collection}</div></div> : null}
          </div>
        ) : null}
      </section>

      {/* Where to Watch */}
      {streamingLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">📺 Where to Watch</h2>
          <div className="flex flex-wrap gap-2">
            {streamingLinks.map((l) => {
              const logo = (l.platform as any)?.logo_url
              const name = (l.platform as any)?.name ?? l.label
              return (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                  className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/25 hover:bg-white/10 transition-colors"
                >
                  {logo ? <img src={logo} alt={name} className="h-6 w-auto max-w-[60px] object-contain" /> : null}
                  <div>
                    <div className="text-xs font-semibold">{name}</div>
                    <div className="text-[10px] text-white/40 group-hover:text-accent transition-colors">Watch now →</div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Music */}
      {musicLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">🎵 Music</h2>
          <div className="flex flex-wrap gap-2">
            {musicLinks.map((l) => {
              const logo = (l.platform as any)?.logo_url
              const name = (l.platform as any)?.name ?? l.label
              return (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 transition-colors">
                  {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[60px] object-contain" /> : <span className="text-sm">{name}</span>}
                </a>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* Cast */}
      {cast.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">Cast</h2>
          <Expandable
            preview={<CastRow credits={cast.slice(0, 8)} />}
            label={`Show all ${cast.length}`} collapseLabel="Show less"
          >
            <CastRow credits={cast} />
          </Expandable>
        </section>
      ) : null}

      {/* Crew */}
      {crew.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">Crew</h2>
          <Expandable
            preview={<CrewRow credits={crew.slice(0, 6)} />}
            label={`Show all ${crew.length}`} collapseLabel="Show less"
          >
            <CrewRow credits={crew} />
          </Expandable>
        </section>
      ) : null}

      <Gallery images={movie.gallery_images ?? []} title={movie.title} />

      <ContentGrid
        title="Similar Movies"
        items={similarMovies.map((m) => ({ id: m.id, title: m.title, to: `/movie/${m.id}`, imageUrl: m.selected_poster_url, logoUrl: m.selected_logo_url, badge: m.tmdb_rating ? `★ ${m.tmdb_rating}` : null }))}
        aspect="poster" showLogo={false}
      />

      {/* Reviews */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-tight">Reviews {avgRating ? <span className="text-sm text-yellow-400 font-normal">★ {avgRating}</span> : null}</h2>
        {user ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <StarRating value={reviewRating} onChange={setReviewRating} />
            <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <div className="flex justify-end">
              <Button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}>Post review</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            <Link to="/login" className="text-accent hover:underline">Log in</Link> to add a review.
          </div>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <SpotlightCard key={r.id} className="p-4" spotlightColor="rgba(168,85,247,0.06)">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white/70">{(r.profile as any)?.email ?? 'Anonymous'}</div>
                <div className="flex items-center gap-2">
                  {r.rating ? <span className="text-xs text-yellow-400">{'★'.repeat(r.rating)}</span> : null}
                  <div className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-white/80">{r.review_text}</div>
            </SpotlightCard>
          ))}
          {!reviews.length ? <div className="text-sm text-white/40">No reviews yet. Be the first!</div> : null}
        </div>
      </section>

      {showTrailer && videoId && <TrailerModal videoId={videoId} title={movie.title} onClose={() => setShowTrailer(false)} />}
    </div>
  )
}

function CastRow({ credits }: { credits: CreditRow[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
          {c.character ? <div className="w-full truncate text-[10px] text-white/50">{c.character}</div> : null}
        </Link>
      ))}
    </div>
  )
}

function CrewRow({ credits }: { credits: CreditRow[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
          {c.job ? <div className="w-full truncate text-[10px] text-white/50">{c.job}</div> : null}
        </Link>
      ))}
    </div>
  )
}
