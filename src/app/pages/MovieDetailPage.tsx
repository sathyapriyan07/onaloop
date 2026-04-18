import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
import BackButton from '../ui/BackButton'
import TextArea from '../ui/TextArea'
import Gallery from '../ui/Gallery'
import Expandable from '../ui/Expandable'
import ContentGrid from '../ui/ContentGrid'
import StarRating from '../ui/StarRating'
import RatingSummary from '../ui/RatingSummary'
import DetailHero from '../ui/detail/DetailHero'
import DetailSection from '../ui/detail/DetailSection'
import PersonCreditRail from '../ui/detail/PersonCreditRail'
import { extractYouTubeId } from '../ui/detail/extractYouTubeId'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import { useSession } from '../../lib/useSession'
import { useUserContent } from '../../lib/useUserContent'
import { usePageMeta } from '../../lib/usePageMeta'

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
type LinkRow = { id: string; label: string; url: string; cover_image_url?: string | null; platform?: { name: string; logo_url: string | null } | null }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }

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

  usePageMeta({ title: movie?.title ?? 'Movie', description: movie?.overview ?? null })

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: movieRow }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: musicRows }, { data: streamingRows }, { data: studioRows }] = await Promise.all([
        supabase.from('movies').select('id,title,overview,release_date,runtime_minutes,tmdb_rating,trailer_url,selected_backdrop_url,selected_logo_url,selected_poster_url,tags,budget,collection,gallery_images,imdb_rating,rotten_tomatoes_rating').eq('id', id).maybeSingle(),
        supabase.from('movie_genres').select('genre:genres(id,name)').eq('movie_id', id),
        supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('movie_id', id).order('sort_order', { ascending: true }),
        supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('movie_id', id).order('created_at', { ascending: false }),
        supabase.from('movie_music_links').select('id,label,url,cover_image_url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order'),
        supabase.from('movie_streaming_links').select('id,label,url,cover_image_url,platform:platforms(name,logo_url)').eq('movie_id', id).order('sort_order'),
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
    <>
      <BackButton />
      <div className="h-[220px] w-full skeleton md:h-[320px]" />
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-4 space-y-3">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-4 w-32 skeleton rounded-lg" />
        <div className="h-4 w-64 skeleton rounded-lg" />
      </div>
    </>
  )

  const videoId = movie.trailer_url ? extractYouTubeId(movie.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const ratingCount = reviews.filter((r) => r.rating).length
  const avgRating = ratingCount ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingCount).toFixed(1) : null
  const runtime = formatRuntime(movie.runtime_minutes)

  return (
    <div>
      <BackButton />

      <DetailHero
        title={movie.title}
        backdropUrl={movie.selected_backdrop_url}
        posterUrl={movie.selected_poster_url}
        logoUrl={movie.selected_logo_url}
        meta={(
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--label2)]">
            {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
            {runtime ? (
              <>
                <span className="text-[var(--label3)]">·</span>
                <span>{runtime}</span>
              </>
            ) : null}
            {movie.tmdb_rating ? (
              <>
                <span className="text-[var(--label3)]">·</span>
                <span className="flex items-center gap-1 font-semibold text-[var(--label)]">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  {movie.tmdb_rating}/10
                </span>
              </>
            ) : null}
          </div>
        )}
        actions={(
          <>
            {videoId ? (
              <button onClick={() => setTrailerOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: 'var(--accent)' }}>
                <Play size={13} fill="currentColor" />
                Trailer
                <ChevronDown size={13} className={`transition-transform duration-200 ${trailerOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : null}
            <button onClick={toggleWatchlist} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors" style={{ background: 'var(--surface)' }}>
              {inWatchlist ? <BookmarkCheck size={14} className="text-accent" /> : <Bookmark size={14} className="text-[var(--label2)]" />}
              <span className={inWatchlist ? 'text-accent' : 'text-[var(--label2)]'}>{inWatchlist ? 'Saved' : 'Watchlist'}</span>
            </button>
            <button onClick={toggleWatched} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors" style={{ background: 'var(--surface)' }}>
              {isWatched ? <Eye size={14} className="text-green-400" /> : <EyeOff size={14} className="text-[var(--label2)]" />}
              <span className={isWatched ? 'text-green-400' : 'text-[var(--label2)]'}>{isWatched ? 'Watched' : 'Watched?'}</span>
            </button>
          </>
        )}
        right={(
          <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
            <div className="text-[10px] uppercase tracking-widest text-[var(--label3)]">Ratings</div>
            <div className="mt-3 space-y-2">
              <RatingRow label="TMDB" value={movie.tmdb_rating ? `${movie.tmdb_rating}/10` : '—'} />
              <RatingRow label="Community" value={avgRating ? `${avgRating}/5` : '—'} />
              <RatingRow label="IMDb" value={movie.imdb_rating ? `${movie.imdb_rating}/10` : '—'} />
              <RatingRow label="Rotten Tomatoes" value={movie.rotten_tomatoes_rating ? `${movie.rotten_tomatoes_rating}%` : '—'} />
            </div>
          </div>
        )}
      />

      <div className="mx-auto w-full max-w-screen-xl px-4 pb-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <main className="space-y-6">
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <Link key={g.id} to={`/genre/${g.id}`}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
                    style={{ background: 'var(--surface)' }}>
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.overview ? (
              <Expandable
                preview={<p className="text-sm leading-relaxed text-[var(--label2)] line-clamp-4">{movie.overview}</p>}
                label="Read more" collapseLabel="Show less">
                <p className="text-sm leading-relaxed text-[var(--label2)]">{movie.overview}</p>
              </Expandable>
            ) : null}

            {videoId && trailerOpen && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)' }}>
                <div className="aspect-video w-full">
                  <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    allow="autoplay; fullscreen" allowFullScreen title={`${movie.title} trailer`}
                    className="h-full w-full" style={{ border: 'none' }} />
                </div>
              </div>
            )}

            {cast.length > 0 && (
              <DetailSection title="Top cast">
                <Expandable preview={<PersonCreditRail credits={cast.slice(0, 10)} />} label={`All cast (${cast.length})`} collapseLabel="Show less">
                  <PersonCreditRail credits={cast} />
                </Expandable>
              </DetailSection>
            )}

            {crew.length > 0 && (
              <DetailSection title="Crew">
                <Expandable preview={<PersonCreditRail credits={crew.slice(0, 8)} sub="job" />} label={`All crew (${crew.length})`} collapseLabel="Show less">
                  <PersonCreditRail credits={crew} sub="job" />
                </Expandable>
              </DetailSection>
            )}

            <Gallery images={movie.gallery_images ?? []} title={movie.title} />

            <ContentGrid
              title="More Like This"
              items={similarMovies.map((m) => ({ id: m.id, title: m.title, to: `/movie/${m.id}`, imageUrl: m.selected_poster_url, logoUrl: m.selected_logo_url, badge: m.tmdb_rating ? `★ ${m.tmdb_rating}` : null }))}
              aspect="poster" showLogo={false}
            />

            <DetailSection title={`Reviews${avgRating ? ` · ★ ${avgRating}` : ''}`}>
              <div className="space-y-3">
                <RatingSummary ratings={reviews.map((r) => r.rating)} />
                {user ? (
                  <div className="space-y-3 rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                    <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <div className="flex justify-end">
                      <button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}
                        className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                        style={{ background: 'var(--accent)' }}>
                        Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 text-sm text-[var(--label2)]" style={{ background: 'var(--surface)' }}>
                    <Link to="/login" className="text-accent hover:opacity-80 font-semibold">Log in</Link> to write a review.
                  </div>
                )}
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-[var(--label2)]">User {r.user_id.slice(0, 8)}</div>
                      <div className="flex items-center gap-2">
                        {r.rating ? <span className="text-xs font-bold text-yellow-400">{'★'.repeat(r.rating)}</span> : null}
                        <span className="text-[10px] text-[var(--label3)]">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--label2)] leading-relaxed">{r.review_text}</p>
                  </div>
                ))}
                {!reviews.length && <div className="text-sm text-[var(--label3)] text-center py-6">No reviews yet.</div>}
              </div>
            </DetailSection>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--label3)]">Details</div>
              <div className="space-y-2">
                {movie.release_date ? <FactRow label="Release date" value={new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} /> : null}
                {runtime ? <FactRow label="Runtime" value={runtime} /> : null}
                {movie.budget ? <FactRow label="Budget" value={movie.budget} /> : null}
                {movie.collection ? <FactRow label="Collection" value={movie.collection} valueClassName="text-green-400" /> : null}
              </div>

              {studios.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--label3)] mb-2">Studios</div>
                  <div className="flex flex-wrap gap-2">
                    {studios.map((s) => (
                      <Link key={s.id} to={`/studio/${s.id}`}
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition-colors hover:brightness-125"
                        style={{ background: 'var(--surface2)' }}>
                        {s.logo_url && <img src={s.logo_url} alt={s.name} className="h-4 w-auto max-w-[36px] object-contain" />}
                        <span className="text-xs font-medium text-[var(--label2)]">{s.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {(movie.tags ?? []).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--label3)] mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(movie.tags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full px-3 py-1 text-[11px] text-[var(--label3)]" style={{ background: 'var(--surface2)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {streamingLinks.length > 0 && (
              <DetailSection title="Where to Watch">
                <div className="flex flex-col gap-2">
                  {streamingLinks.map((l) => {
                    const logo = (l.platform as any)?.logo_url
                    const name = (l.platform as any)?.name ?? l.label
                    return (
                      <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-colors hover:brightness-125"
                        style={{ background: 'var(--surface)' }}>
                        {l.cover_image_url ? (
                          <img src={l.cover_image_url} alt={name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                        ) : logo ? (
                          <img src={logo} alt={name} className="h-5 w-auto max-w-[56px] object-contain shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--label)]">{name}</div>
                          {l.cover_image_url && <div className="text-[10px] text-[var(--label3)]">Watch now</div>}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </DetailSection>
            )}

            {musicLinks.length > 0 && (
              <DetailSection title="Music">
                <div className="flex flex-col gap-2">
                  {musicLinks.map((l) => {
                    const logo = (l.platform as any)?.logo_url
                    const name = (l.platform as any)?.name ?? l.label
                    return (
                      <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 rounded-2xl px-3 py-2 transition-colors hover:brightness-125"
                        style={{ background: 'var(--surface)' }}>
                        {l.cover_image_url ? (
                          <img src={l.cover_image_url} alt={name} className="h-10 w-10 rounded-xl object-cover shrink-0" />
                        ) : logo ? (
                          <img src={logo} alt={name} className="h-5 w-auto max-w-[56px] object-contain shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--label)]">{name}</div>
                          {l.cover_image_url && <div className="text-[10px] text-[var(--label3)]">Listen now</div>}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </DetailSection>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function RatingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs font-semibold text-[var(--label2)]">{label}</div>
      <div className="text-xs font-bold text-[var(--label)]">{value}</div>
    </div>
  )
}

function FactRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-xs text-[var(--label3)]">{label}</div>
      <div className={`text-xs font-semibold text-[var(--label)] text-right ${valueClassName ?? ''}`}>{value}</div>
    </div>
  )
}

