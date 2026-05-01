import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
import BackButton from '../ui/BackButton'
import TextArea from '../ui/TextArea'
import Expandable from '../ui/Expandable'
import ContentGrid from '../ui/ContentGrid'
import StarRating from '../ui/StarRating'
import DetailHero from '../ui/detail/DetailHero'
import DetailSection from '../ui/detail/DetailSection'
import PersonCreditRail from '../ui/detail/PersonCreditRail'
import { extractYouTubeId } from '../ui/detail/extractYouTubeId'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../lib/useSession'
import { useUserContent } from '../../lib/useUserContent'
import { usePageMeta } from '../../lib/usePageMeta'

type Series = {
  id: string; title: string; overview: string | null; first_air_date: string | null
  tmdb_rating: number | null; trailer_url: string | null
  selected_backdrop_url: string | null; selected_logo_url: string | null
  selected_poster_url: string | null
}
type Genre = { id: string; name: string }
type Review = { id: string; user_id: string; rating: number | null; review_text: string; created_at: string }
type LinkRow = { id: string; label: string; url: string; cover_image_url?: string | null; platform?: { name: string; logo_url: string | null } | null }
type CreditRow = { id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null; sort_order: number; person: { id: string; name: string; selected_profile_url: string | null } | null }

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const { inWatchlist, isWatched, toggleWatchlist, toggleWatched } = useUserContent(id, 'series')
  const [series, setSeries] = useState<Series | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [similarSeries, setSimilarSeries] = useState<any[]>([])

  usePageMeta({ title: series?.title ?? 'Series', description: series?.overview ?? null })

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const [{ data: row }, { data: genreRows }, { data: creditRows }, { data: reviewRows }, { data: streamingRows }, { data: musicRows }] = await Promise.all([
        supabase.from('series').select('id,title,overview,first_air_date,tmdb_rating,trailer_url,selected_backdrop_url,selected_logo_url,selected_poster_url').eq('id', id).maybeSingle(),
        supabase.from('series_genres').select('genre:genres(id,name)').eq('series_id', id),
        supabase.from('credits').select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)').eq('series_id', id).order('sort_order', { ascending: true }),
        supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('series_id', id).order('created_at', { ascending: false }),
        supabase.from('series_streaming_links').select('id,label,url,cover_image_url,platform:platforms(name,logo_url)').eq('series_id', id).order('sort_order'),
        supabase.from('series_music_links').select('id,label,url,cover_image_url,platform:platforms(name,logo_url)').eq('series_id', id).order('sort_order'),
      ])
      if (!isMounted) return
      setSeries((row ?? null) as Series | null)
      const fetchedGenres = ((genreRows ?? []).map((r: any) => r.genre).filter(Boolean)) as Genre[]
      setGenres(fetchedGenres)
      setCredits((creditRows ?? []) as unknown as CreditRow[])
      setReviews((reviewRows ?? []) as unknown as Review[])
      setStreamingLinks((streamingRows ?? []) as unknown as LinkRow[])
      setMusicLinks((musicRows ?? []) as unknown as LinkRow[])
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
      await supabase.from('reviews').upsert({ user_id: user.id, series_id: id, review_text: reviewText.trim(), rating: reviewRating || null }, { onConflict: 'user_id,series_id' })
      setReviewText(''); setReviewRating(0)
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at').eq('series_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally { setIsSubmitting(false) }
  }

  if (!series) return (
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

  const videoId = series.trailer_url ? extractYouTubeId(series.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const ratingCount = reviews.filter((r) => r.rating).length
  const avgRating = ratingCount ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingCount).toFixed(1) : null

  return (
    <div>
      <BackButton />

      <DetailHero
        title={series.title}
        backdropUrl={series.selected_backdrop_url}
        posterUrl={series.selected_poster_url}
        logoUrl={series.selected_logo_url}
        meta={(
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[var(--label2)]">
            {series.first_air_date ? <span>{series.first_air_date.slice(0, 4)}</span> : null}
            {series.tmdb_rating ? (
              <>
                <span className="text-[var(--label3)]">·</span>
                <span className="flex items-center gap-1 font-semibold text-[var(--label)]">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  {series.tmdb_rating}/10
                </span>
              </>
            ) : null}
          </div>
        )}
        actions={(
          <>
            {videoId ? (
              <button onClick={() => setTrailerOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
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
              <RatingRow label="TMDB" value={series.tmdb_rating ? `${series.tmdb_rating}/10` : '—'} />
            </div>
          </div>
        )}
      />

      <div className="mx-auto w-full max-w-screen-xl px-4 pb-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <main className="min-w-0 space-y-6">
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

            {series.overview ? (
              <Expandable
                preview={<p className="text-sm leading-relaxed text-[var(--label2)] line-clamp-4">{series.overview}</p>}
                label="Read more" collapseLabel="Show less">
                <p className="text-sm leading-relaxed text-[var(--label2)]">{series.overview}</p>
              </Expandable>
            ) : null}

            {videoId && trailerOpen && (
              <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--surface)' }}>
                <div className="aspect-video w-full">
                  <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                    allow="autoplay; fullscreen" allowFullScreen title={`${series.title} trailer`}
                    className="h-full w-full max-w-full" style={{ border: 'none' }} />
                </div>
              </div>
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

            <ContentGrid
              title="More Like This"
              items={similarSeries.map((s) => ({ id: s.id, title: s.title, to: `/series/${s.id}`, imageUrl: s.selected_poster_url, logoUrl: s.selected_logo_url, badge: s.tmdb_rating ? `★ ${s.tmdb_rating}` : null }))}
              aspect="poster" showLogo={false}
              colsClassName="grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            />

            <DetailSection title={`Reviews${avgRating ? ` · ★ ${avgRating}` : ''}`}>
              <div className="space-y-3">
                {user ? (
                  <div className="space-y-3 rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                    <TextArea placeholder="Write a review…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
                    <div className="flex justify-end">
                      <button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}
                        className="rounded-full px-5 py-2 text-sm font-black disabled:opacity-40 transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
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
                    <p className="break-words text-sm text-[var(--label2)] leading-relaxed">{r.review_text}</p>
                  </div>
                ))}
                {!reviews.length && <div className="text-sm text-[var(--label3)] text-center py-6">No reviews yet.</div>}
              </div>
            </DetailSection>
          </main>

          <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
              <div className="text-[10px] uppercase tracking-widest text-[var(--label3)]">Details</div>
              <div className="space-y-2">
                {series.first_air_date ? <FactRow label="First air date" value={new Date(series.first_air_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} /> : null}
              </div>
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
