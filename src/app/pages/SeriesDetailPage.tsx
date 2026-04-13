import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff } from 'lucide-react'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import Expandable from '../ui/Expandable'
import ContentRail from '../ui/ContentRail'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../lib/useSession'
import { useUserContent } from '../../lib/useUserContent'

type Series = {
  id: string; title: string; overview: string | null; first_air_date: string | null
  tmdb_rating: number | null; trailer_url: string | null
  selected_backdrop_url: string | null; selected_logo_url: string | null
  selected_poster_url: string | null
}
type Genre = { id: string; name: string }
type Review = { id: string; user_id: string; rating: number | null; review_text: string; created_at: string }
type LinkRow = { id: string; label: string; url: string; platform?: { name: string; logo_url: string | null } | null }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }
type SimilarSeries = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null; tmdb_rating: number | null }

function extractYouTubeId(url: string) {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return m?.[1] ?? null
}

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const { inWatchlist, isWatched, toggleWatchlist, toggleWatched } = useUserContent(id, 'series')
  const [series, setSeries] = useState<Series | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [similarSeries, setSimilarSeries] = useState<SimilarSeries[]>([])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: row }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: streamingRows }] = await Promise.all([
        supabase.from('series').select('id,title,overview,first_air_date,tmdb_rating,trailer_url,selected_backdrop_url,selected_logo_url,selected_poster_url').eq('id', id).maybeSingle(),
        supabase.from('series_genres').select('genre:genres(id,name)').eq('series_id', id),
        supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('series_id', id).order('sort_order', { ascending: true }),
        supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('series_id', id).order('created_at', { ascending: false }),
        supabase.from('series_streaming_links').select('id,label,url,platform:platforms(name,logo_url)').eq('series_id', id).order('sort_order'),
      ])
      if (!isMounted) return
      setSeries((row ?? null) as Series | null)
      const fetchedGenres = ((genreRows ?? []).map((r: any) => r.genre).filter(Boolean)) as Genre[]
      setGenres(fetchedGenres)
      setCredits((creditRows ?? []) as unknown as CreditRow[])
      setReviews((reviewRows ?? []) as unknown as Review[])
      setStreamingLinks((streamingRows ?? []) as unknown as LinkRow[])

      if (fetchedGenres.length >= 1) {
        const { data: simRows } = await supabase.from('series_genres').select('series_id,genre_id,series:series(id,title,selected_poster_url,selected_logo_url,tmdb_rating)').in('genre_id', fetchedGenres.map((g) => g.id)).neq('series_id', id)
        if (isMounted) {
          const seriesMap = new Map<string, any>()
          for (const r of (simRows ?? []) as any[]) {
            const s = Array.isArray(r.series) ? r.series[0] : r.series
            if (s) seriesMap.set(s.id, s)
          }
          setSimilarSeries([...seriesMap.values()].sort((a, b) => (b.tmdb_rating ?? 0) - (a.tmdb_rating ?? 0)).slice(0, 12))
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
      await supabase.from('reviews').insert({ user_id: user.id, series_id: id, review_text: reviewText.trim() })
      setReviewText('')
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('series_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally { setIsSubmitting(false) }
  }

  if (!series) return <div className="text-white/40 text-sm">Loading…</div>

  const videoId = series.trailer_url ? extractYouTubeId(series.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')

  return (
    <div className="space-y-6">
      {/* Backdrop hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
          {series.selected_backdrop_url
            ? <img src={series.selected_backdrop_url} alt={series.title} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-accent/20 via-white/5 to-transparent" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 space-y-3">
            {series.selected_logo_url
              ? <img src={series.selected_logo_url} alt={series.title} className="max-h-16 w-auto max-w-[60%] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]" />
              : <h1 className="text-2xl font-black tracking-tight">{series.title}</h1>
            }
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
              {series.first_air_date ? <span>{series.first_air_date.slice(0, 4)}</span> : null}
              {series.tmdb_rating ? <span>★ {series.tmdb_rating}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              {videoId && (
                <button onClick={() => setTrailerOpen((v) => !v)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-opacity hover:opacity-90" style={{ background: 'var(--accent)' }}>
                  <Play size={12} fill="currentColor" /> {trailerOpen ? 'Hide Trailer' : 'Trailer'}
                  <ChevronDown size={12} className={`transition-transform duration-300 ${trailerOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
              <button onClick={toggleWatchlist} title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${inWatchlist ? 'border-accent bg-accent/15 text-accent' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
                {inWatchlist ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              </button>
              <button onClick={toggleWatched} title={isWatched ? 'Mark as Unwatched' : 'Mark as Watched'} className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${isWatched ? 'border-green-500 bg-green-500/15 text-green-400' : 'border-white/20 bg-white/10 text-white hover:bg-white/15'}`}>
                {isWatched ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Trailer */}
      {videoId && trailerOpen && (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className="aspect-video w-full">
            <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`} allow="autoplay; fullscreen" allowFullScreen title={`${series.title} trailer`} className="h-full w-full" style={{ border: 'none' }} />
          </div>
        </section>
      )}

      {/* Meta */}
      <section className="space-y-3">
        {genres.length ? (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <Link key={g.id} to={`/genre/${g.id}`} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 hover:border-accent/50 hover:text-accent transition-colors">
                {g.name}
              </Link>
            ))}
          </div>
        ) : null}
        {series.overview ? (
          <Expandable preview={<p className="text-sm leading-relaxed text-white/70 line-clamp-3">{series.overview}</p>} label="Read more" collapseLabel="Show less">
            <p className="text-sm leading-relaxed text-white/70">{series.overview}</p>
          </Expandable>
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
                  className="group flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-white/25 hover:bg-white/10 transition-colors">
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

      {/* Cast */}
      {cast.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">Cast</h2>
          <Expandable preview={<PersonRow credits={cast.slice(0, 8)} />} label={`Show all ${cast.length}`} collapseLabel="Show less">
            <PersonRow credits={cast} />
          </Expandable>
        </section>
      ) : null}

      {/* Crew */}
      {crew.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold tracking-tight">Crew</h2>
          <Expandable preview={<PersonRow credits={crew.slice(0, 6)} showJob />} label={`Show all ${crew.length}`} collapseLabel="Show less">
            <PersonRow credits={crew} showJob />
          </Expandable>
        </section>
      ) : null}

      <ContentRail
        title="Similar Series"
        items={similarSeries.map((s) => ({ id: s.id, title: s.title, to: `/series/${s.id}`, imageUrl: s.selected_poster_url, logoUrl: s.selected_logo_url, badge: s.tmdb_rating ? `★ ${s.tmdb_rating}` : null }))}
        aspect="poster" showLogo={false}
      />

      {/* Reviews */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-tight">Reviews</h2>
        {user ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
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
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white/60">User {r.user_id.slice(0, 8)}</div>
                <div className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <div className="mt-2 text-sm text-white/80">{r.review_text}</div>
            </div>
          ))}
          {!reviews.length ? <div className="text-sm text-white/40">No reviews yet. Be the first!</div> : null}
        </div>
      </section>
    </div>
  )
}

function PersonRow({ credits, showJob = false }: { credits: CreditRow[]; showJob?: boolean }) {
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
          {!showJob && c.character ? <div className="w-full truncate text-[10px] text-white/50">{c.character}</div> : null}
          {showJob && c.job ? <div className="w-full truncate text-[10px] text-white/50">{c.job}</div> : null}
        </Link>
      ))}
    </div>
  )
}
