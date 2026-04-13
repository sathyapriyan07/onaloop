import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
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
type Review = { id: string; user_id: string; rating: number | null; review_text: string; created_at: string }
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

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-sm font-black uppercase tracking-tight mb-4">{title}</h2>
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
  const [trailerOpen, setTrailerOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: movieRow }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: musicRows }, { data: streamingRows }, { data: studioRows }] = await Promise.all([
        supabase.from('movies').select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,selected_backdrop_url,backdrop_images,selected_logo_url,title_logos,selected_poster_url,tags,budget,collection,gallery_images,imdb_rating,rotten_tomatoes_rating').eq('id', id).maybeSingle(),
        supabase.from('movie_genres').select('genre:genres(id,name)').eq('movie_id', id),
        supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('movie_id', id).order('sort_order', { ascending: true }),
        supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('movie_id', id).order('created_at', { ascending: false }),
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
          const movieMap = new Map<string, any>()
          for (const row of (simRows ?? []) as any[]) {
            const m = Array.isArray(row.movie) ? row.movie[0] : row.movie
            if (m) movieMap.set(m.id, m)
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
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('movie_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally { setIsSubmitting(false) }
  }

  if (!movie) return (
    <div className="space-y-4 animate-pulse">
      <div className="aspect-[16/9] w-full rounded-xl bg-white/5" />
      <div className="h-6 w-48 rounded bg-white/5" />
    </div>
  )

  const videoId = movie.trailer_url ? extractYouTubeId(movie.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const avgRating = reviews.filter((r) => r.rating).length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.filter((r) => r.rating).length).toFixed(1)
    : null

  return (
    <div className="space-y-0 -mx-4">

      {/* ── BACKDROP ── full bleed, no border radius */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/8] overflow-hidden">
        {movie.selected_backdrop_url
          ? <img src={movie.selected_backdrop_url} alt={movie.title} className="h-full w-full object-cover" />
          : <div className="h-full w-full" style={{ background: '#161616' }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f]/70 via-transparent to-transparent" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-4 space-y-6">

        {/* Poster + Info row */}
        <div className="flex gap-4 -mt-10 md:-mt-24 relative z-10">
          {/* Poster */}
          {movie.selected_poster_url && (
            <div className="shrink-0 w-24 md:w-36" style={{ aspectRatio: '2/3' }}>
              <img src={movie.selected_poster_url} alt={movie.title} className="h-full w-full object-cover rounded-xl shadow-2xl border border-white/10" />
            </div>
          )}

          {/* Title + meta */}
          <div className="flex-1 min-w-0 pt-4 md:pt-20 space-y-2">
            {movie.selected_logo_url ? (
              <img src={movie.selected_logo_url} alt={movie.title} className="max-h-12 md:max-h-16 w-auto max-w-[80%] object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]" />
            ) : (
              <h1 className="text-xl md:text-3xl font-black tracking-tight leading-tight">{movie.title}</h1>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
              {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
              {movie.release_date && movie.runtime_minutes ? <span className="text-white/20">•</span> : null}
              {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
            </div>

            {/* Ratings row — plain text */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
              {movie.tmdb_rating ? <span className="flex items-center gap-1 font-bold text-white"><Star size={11} className="text-accent" fill="currentColor" />{movie.tmdb_rating}</span> : null}
              {movie.imdb_rating ? <span className="flex items-center gap-1"><img src="/IMDB_Logo_2016.svg.png" alt="IMDb" className="h-2.5 w-auto" />{movie.imdb_rating}</span> : null}
              {movie.rotten_tomatoes_rating ? <span className="flex items-center gap-1"><img src="/Rotten_Tomatoes.svg.png" alt="RT" className="h-2.5 w-auto" />{movie.rotten_tomatoes_rating}%</span> : null}
              {avgRating ? <span className="flex items-center gap-1">★ {avgRating} community</span> : null}
            </div>
          </div>
        </div>

        {/* Genre pills */}
        {genres.length ? (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <Link key={g.id} to={`/genre/${g.id}`}
                className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold text-white/60 hover:border-accent/50 hover:text-accent transition-colors"
                style={{ background: '#1a1a1a' }}>
                {g.name}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {videoId && (
            <button onClick={() => setTrailerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)' }}>
              <Play size={13} fill="currentColor" />
              {trailerOpen ? 'Hide Trailer' : 'Trailer'}
              <ChevronDown size={13} className={`transition-transform duration-300 ${trailerOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button onClick={toggleWatchlist} title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold border transition-colors ${inWatchlist ? 'border-accent/50 text-accent' : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white'}`}
            style={{ background: '#1a1a1a' }}>
            {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {inWatchlist ? 'Saved' : 'Watchlist'}
          </button>
          <button onClick={toggleWatched} title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold border transition-colors ${isWatched ? 'border-green-500/50 text-green-400' : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white'}`}
            style={{ background: '#1a1a1a' }}>
            {isWatched ? <Eye size={14} /> : <EyeOff size={14} />}
            {isWatched ? 'Watched' : 'Mark Watched'}
          </button>
        </div>

        {/* Overview */}
        {movie.overview ? (
          <div style={{ background: '#161616' }} className="rounded-xl p-4">
            <SectionHeader title="Overview" />
            <Expandable preview={<p className="text-sm leading-relaxed text-white/60 line-clamp-4">{movie.overview}</p>} label="Read more" collapseLabel="Show less">
              <p className="text-sm leading-relaxed text-white/60">{movie.overview}</p>
            </Expandable>
          </div>
        ) : null}

        {/* Inline Trailer */}
        {videoId && trailerOpen && (
          <div className="overflow-hidden rounded-xl" style={{ background: '#000' }}>
            <div className="aspect-video w-full">
              <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; fullscreen" allowFullScreen title={`${movie.title} trailer`}
                className="h-full w-full" style={{ border: 'none' }} />
            </div>
          </div>
        )}

        {/* Where to Watch */}
        {streamingLinks.length ? (
          <div style={{ background: '#161616' }} className="rounded-xl p-4">
            <SectionHeader title="Where to Watch" />
            <div className="flex flex-wrap gap-2">
              {streamingLinks.map((l) => {
                const logo = (l.platform as any)?.logo_url
                const name = (l.platform as any)?.name ?? l.label
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                    className="group flex items-center gap-2.5 rounded-lg border border-white/8 px-4 py-2.5 hover:border-accent/30 transition-colors"
                    style={{ background: '#1e1e1e' }}>
                    {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[60px] object-contain" /> : null}
                    <div>
                      <div className="text-xs font-bold">{name}</div>
                      <div className="text-[10px] text-white/30 group-hover:text-accent transition-colors">Watch now →</div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Music */}
        {musicLinks.length ? (
          <div style={{ background: '#161616' }} className="rounded-xl p-4">
            <SectionHeader title="Music" />
            <div className="flex flex-wrap gap-2">
              {musicLinks.map((l) => {
                const logo = (l.platform as any)?.logo_url
                const name = (l.platform as any)?.name ?? l.label
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-white/8 px-4 py-2 hover:border-white/15 transition-colors"
                    style={{ background: '#1e1e1e' }}>
                    {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[60px] object-contain" /> : <span className="text-xs font-semibold">{name}</span>}
                  </a>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Studios */}
        {studios.length ? (
          <div className="flex flex-wrap gap-2">
            {studios.map((s) => (
              <Link key={s.id} to={`/studio/${s.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-white/8 px-3 py-1.5 hover:border-white/15 transition-colors"
                style={{ background: '#1a1a1a' }}>
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-4 w-auto max-w-[40px] object-contain" /> : null}
                <span className="text-xs font-semibold text-white/60">{s.name}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {/* Budget / Collection */}
        {(movie.budget || movie.collection) ? (
          <div className="flex flex-wrap gap-4 rounded-xl border border-white/8 px-4 py-3" style={{ background: '#161616' }}>
            {movie.budget ? (
              <div><div className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Budget</div><div className="text-sm font-bold">{movie.budget}</div></div>
            ) : null}
            {movie.budget && movie.collection ? <div className="w-px bg-white/8" /> : null}
            {movie.collection ? (
              <div><div className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Collection</div><div className="text-sm font-bold text-green-400">{movie.collection}</div></div>
            ) : null}
          </div>
        ) : null}

        {/* Tags */}
        {(movie.tags ?? []).length ? (
          <div className="flex flex-wrap gap-1.5">
            {(movie.tags ?? []).map((tag) => (
              <span key={tag} className="rounded-md border border-white/8 px-2.5 py-1 text-xs text-white/40" style={{ background: '#1a1a1a' }}>{tag}</span>
            ))}
          </div>
        ) : null}

        {/* Cast */}
        {cast.length ? (
          <div style={{ background: '#161616' }} className="rounded-xl p-4">
            <SectionHeader title="Cast" />
            <Expandable preview={<CastScroll credits={cast.slice(0, 10)} />} label={`Show all ${cast.length}`} collapseLabel="Show less">
              <CastScroll credits={cast} />
            </Expandable>
          </div>
        ) : null}

        {/* Crew */}
        {crew.length ? (
          <div style={{ background: '#161616' }} className="rounded-xl p-4">
            <SectionHeader title="Crew" />
            <Expandable preview={<CrewScroll credits={crew.slice(0, 8)} />} label={`Show all ${crew.length}`} collapseLabel="Show less">
              <CrewScroll credits={crew} />
            </Expandable>
          </div>
        ) : null}

        {/* Gallery */}
        <Gallery images={movie.gallery_images ?? []} title={movie.title} />

        {/* Similar */}
        <ContentGrid
          title="More Like This"
          items={similarMovies.map((m) => ({ id: m.id, title: m.title, to: `/movie/${m.id}`, imageUrl: m.selected_poster_url, logoUrl: m.selected_logo_url, badge: m.tmdb_rating ? `★ ${m.tmdb_rating}` : null }))}
          aspect="poster" showLogo={false}
        />

        {/* Reviews */}
        <div style={{ background: '#161616' }} className="rounded-xl p-4 space-y-4">
          <SectionHeader title={`Reviews${avgRating ? ` · ★ ${avgRating}` : ''}`} />
          {user ? (
            <div className="space-y-3 rounded-xl border border-white/8 p-4" style={{ background: '#1a1a1a' }}>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              <div className="flex justify-end">
                <Button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}>Post review</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 p-4 text-sm text-white/40" style={{ background: '#1a1a1a' }}>
              <Link to="/login" className="text-accent hover:underline font-semibold">Log in</Link> to write a review.
            </div>
          )}
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/8 p-4" style={{ background: '#1a1a1a' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-white/60">User {r.user_id.slice(0, 8)}</div>
                  <div className="flex items-center gap-2">
                    {r.rating ? <span className="text-xs font-bold text-yellow-400">{'★'.repeat(r.rating)}</span> : null}
                    <span className="text-[10px] text-white/25">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">{r.review_text}</p>
              </div>
            ))}
            {!reviews.length ? <div className="text-sm text-white/30 text-center py-4">No reviews yet. Be the first!</div> : null}
          </div>
        </div>

      </div>
    </div>
  )
}

function CastScroll({ credits }: { credits: CreditRow[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center group">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5 border border-white/8 group-hover:border-accent/30 transition-colors">
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white/20">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-[10px] font-bold leading-tight">{c.person.name}</div>
          {c.character ? <div className="w-full truncate text-[9px] text-white/40">{c.character}</div> : null}
        </Link>
      ))}
    </div>
  )
}

function CrewScroll({ credits }: { credits: CreditRow[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center group">
          <div className="h-16 w-16 overflow-hidden rounded-xl bg-white/5 border border-white/8 group-hover:border-accent/30 transition-colors">
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white/20">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-[10px] font-bold leading-tight">{c.person.name}</div>
          {c.job ? <div className="w-full truncate text-[9px] text-white/40">{c.job}</div> : null}
        </Link>
      ))}
    </div>
  )
}
