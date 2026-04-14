import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
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
  selected_backdrop_url: string | null; selected_logo_url: string | null
  selected_poster_url: string | null; tags: string[]
  budget: string | null; collection: string | null; gallery_images: string[]
  imdb_rating: number | null; rotten_tomatoes_rating: number | null
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-widest text-white/40">{title}</h2>
      {children}
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
  const [trailerOpen, setTrailerOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: movieRow }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: musicRows }, { data: streamingRows }, { data: studioRows }] = await Promise.all([
        supabase.from('movies').select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,selected_backdrop_url,selected_logo_url,selected_poster_url,tags,budget,collection,gallery_images,imdb_rating,rotten_tomatoes_rating').eq('id', id).maybeSingle(),
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
    <div className="space-y-0 -mx-4">
      <div className="aspect-[16/9] w-full skeleton" />
      <div className="px-4 pt-4 space-y-3">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-4 w-32 skeleton rounded-lg" />
        <div className="h-4 w-64 skeleton rounded-lg" />
      </div>
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

      {/* Full-bleed backdrop */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/8] overflow-hidden -mt-16">
        {movie.selected_backdrop_url
          ? <img src={movie.selected_backdrop_url} alt={movie.title} className="h-full w-full object-cover" />
          : <div className="h-full w-full bg-[#111]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="px-4 space-y-7">

        {/* Poster + title row */}
        <div className="flex gap-4 relative z-10 -mt-20 md:-mt-28">
          {movie.selected_poster_url && (
            <div className="shrink-0 w-24 md:w-36 rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '2/3' }}>
              <img src={movie.selected_poster_url} alt={movie.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-end pb-1 space-y-2">
            {movie.selected_logo_url ? (
              <img src={movie.selected_logo_url} alt={movie.title} className="max-h-14 md:max-h-20 w-auto max-w-full object-contain object-left drop-shadow-2xl" />
            ) : (
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">{movie.title}</h1>
            )}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/40">
              {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
              {formatRuntime(movie.runtime_minutes) ? <><span className="text-white/20">·</span><span>{formatRuntime(movie.runtime_minutes)}</span></> : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {movie.tmdb_rating ? <span className="flex items-center gap-1 font-semibold text-white"><Star size={11} className="text-yellow-400" fill="currentColor" />{movie.tmdb_rating}</span> : null}
              {movie.imdb_rating ? <span className="flex items-center gap-1 text-white/50"><img src="/IMDB_Logo_2016.svg.png" alt="IMDb" className="h-2.5 w-auto" />{movie.imdb_rating}</span> : null}
              {movie.rotten_tomatoes_rating ? <span className="flex items-center gap-1 text-white/50"><img src="/Rotten_Tomatoes.svg.png" alt="RT" className="h-2.5 w-auto" />{movie.rotten_tomatoes_rating}%</span> : null}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {videoId && (
            <button onClick={() => setTrailerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: 'var(--accent)' }}>
              <Play size={13} fill="currentColor" />
              {trailerOpen ? 'Hide Trailer' : 'Trailer'}
              <ChevronDown size={13} className={`transition-transform duration-300 ${trailerOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button onClick={toggleWatchlist}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${inWatchlist ? 'text-accent' : 'text-white/70 hover:text-white'}`}
            style={{ background: 'var(--surface)' }}>
            {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {inWatchlist ? 'Saved' : 'Watchlist'}
          </button>
          <button onClick={toggleWatched}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${isWatched ? 'text-green-400' : 'text-white/70 hover:text-white'}`}
            style={{ background: 'var(--surface)' }}>
            {isWatched ? <Eye size={14} /> : <EyeOff size={14} />}
            {isWatched ? 'Watched' : 'Mark Watched'}
          </button>
        </div>

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <Link key={g.id} to={`/genre/${g.id}`}
                className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-white/60 hover:text-white transition-colors"
                style={{ background: 'var(--surface)' }}>
                {g.name}
              </Link>
            ))}
          </div>
        )}

        {/* Overview */}
        {movie.overview && (
          <Expandable
            preview={<p className="text-sm leading-relaxed text-white/60 line-clamp-4">{movie.overview}</p>}
            label="Read more" collapseLabel="Show less">
            <p className="text-sm leading-relaxed text-white/60">{movie.overview}</p>
          </Expandable>
        )}

        {/* Inline Trailer */}
        {videoId && trailerOpen && (
          <div className="overflow-hidden rounded-2xl bg-black">
            <div className="aspect-video w-full">
              <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; fullscreen" allowFullScreen title={`${movie.title} trailer`}
                className="h-full w-full" style={{ border: 'none' }} />
            </div>
          </div>
        )}

        {/* Where to Watch */}
        {streamingLinks.length > 0 && (
          <Section title="Where to Watch">
            <div className="flex flex-wrap gap-2">
              {streamingLinks.map((l) => {
                const logo = (l.platform as any)?.logo_url
                const name = (l.platform as any)?.name ?? l.label
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 hover:bg-white/8 transition-colors"
                    style={{ background: 'var(--surface)' }}>
                    {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[56px] object-contain" /> : null}
                    <div>
                      <div className="text-xs font-semibold">{name}</div>
                      <div className="text-[10px] text-white/30">Watch now</div>
                    </div>
                  </a>
                )
              })}
            </div>
          </Section>
        )}

        {/* Music */}
        {musicLinks.length > 0 && (
          <Section title="Music">
            <div className="flex flex-wrap gap-2">
              {musicLinks.map((l) => {
                const logo = (l.platform as any)?.logo_url
                const name = (l.platform as any)?.name ?? l.label
                return (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 rounded-2xl px-4 py-2 hover:bg-white/8 transition-colors"
                    style={{ background: 'var(--surface)' }}>
                    {logo ? <img src={logo} alt={name} className="h-5 w-auto max-w-[56px] object-contain" /> : <span className="text-xs font-semibold">{name}</span>}
                  </a>
                )
              })}
            </div>
          </Section>
        )}

        {/* Studios */}
        {studios.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {studios.map((s) => (
              <Link key={s.id} to={`/studio/${s.id}`}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 hover:bg-white/8 transition-colors"
                style={{ background: 'var(--surface)' }}>
                {s.logo_url ? <img src={s.logo_url} alt={s.name} className="h-4 w-auto max-w-[36px] object-contain" /> : null}
                <span className="text-xs font-medium text-white/50">{s.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Budget / Collection */}
        {(movie.budget || movie.collection) && (
          <div className="flex flex-wrap gap-6 rounded-2xl px-5 py-4" style={{ background: 'var(--surface)' }}>
            {movie.budget && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Budget</div>
                <div className="text-sm font-bold">{movie.budget}</div>
              </div>
            )}
            {movie.collection && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Collection</div>
                <div className="text-sm font-bold text-green-400">{movie.collection}</div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {(movie.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(movie.tags ?? []).map((tag) => (
              <span key={tag} className="rounded-full px-3 py-1 text-[11px] text-white/35"
                style={{ background: 'var(--surface)' }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <Section title="Cast">
            <Expandable preview={<PersonScroll credits={cast.slice(0, 10)} />} label={`All ${cast.length}`} collapseLabel="Show less">
              <PersonScroll credits={cast} />
            </Expandable>
          </Section>
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <Section title="Crew">
            <Expandable preview={<PersonScroll credits={crew.slice(0, 8)} sub="job" />} label={`All ${crew.length}`} collapseLabel="Show less">
              <PersonScroll credits={crew} sub="job" />
            </Expandable>
          </Section>
        )}

        {/* Gallery */}
        <Gallery images={movie.gallery_images ?? []} title={movie.title} />

        {/* Similar */}
        <ContentGrid
          title="More Like This"
          items={similarMovies.map((m) => ({ id: m.id, title: m.title, to: `/movie/${m.id}`, imageUrl: m.selected_poster_url, logoUrl: m.selected_logo_url, badge: m.tmdb_rating ? `★ ${m.tmdb_rating}` : null }))}
          aspect="poster" showLogo={false}
        />

        {/* Reviews */}
        <Section title={`Reviews${avgRating ? ` · ★ ${avgRating}` : ''}`}>
          <div className="space-y-3">
            {user ? (
              <div className="space-y-3 rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                <StarRating value={reviewRating} onChange={setReviewRating} />
                <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                <div className="flex justify-end">
                  <button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}
                    className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-85"
                    style={{ background: 'var(--accent)' }}>
                    Post
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 text-sm text-white/35" style={{ background: 'var(--surface)' }}>
                <Link to="/login" className="text-accent hover:opacity-80 font-semibold">Log in</Link> to write a review.
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white/40">User {r.user_id.slice(0, 8)}</div>
                  <div className="flex items-center gap-2">
                    {r.rating ? <span className="text-xs font-bold text-yellow-400">{'★'.repeat(r.rating)}</span> : null}
                    <span className="text-[10px] text-white/20">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{r.review_text}</p>
              </div>
            ))}
            {!reviews.length && <div className="text-sm text-white/25 text-center py-6">No reviews yet.</div>}
          </div>
        </Section>

      </div>
    </div>
  )
}

function PersonScroll({ credits, sub = 'character' }: { credits: CreditRow[]; sub?: 'character' | 'job' }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center group">
          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-[#1c1c1e]">
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white/20">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-[10px] font-semibold leading-tight">{c.person.name}</div>
          {(sub === 'character' ? c.character : c.job) && (
            <div className="w-full truncate text-[9px] text-white/35">{sub === 'character' ? c.character : c.job}</div>
          )}
        </Link>
      ))}
    </div>
  )
}
