import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, ChevronDown, Bookmark, BookmarkCheck, Eye, EyeOff, Star } from 'lucide-react'
import BackButton from '../ui/BackButton'
import YouTubeHero from '../ui/YouTubeHero'
import TextArea from '../ui/TextArea'
import Expandable from '../ui/Expandable'
import ContentGrid from '../ui/ContentGrid'
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

function extractYouTubeId(url: string) {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return m?.[1] ?? null
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">{title}</h2>
      {children}
    </div>
  )
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
  const [similarSeries, setSimilarSeries] = useState<any[]>([])

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

  if (!series) return (
    <>
      <BackButton />
      <div className="aspect-[16/9] w-full skeleton" />
      <div className="px-4 pt-4 space-y-3">
        <div className="h-8 w-48 skeleton rounded-xl" />
        <div className="h-4 w-32 skeleton rounded-lg" />
      </div>
    </>
  )

  const videoId = series.trailer_url ? extractYouTubeId(series.trailer_url) : null
  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')

  return (
    <div>
      <BackButton />

      {/* Hero — autoplay trailer if available, else backdrop */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/8] overflow-hidden">
        {videoId ? (
          <YouTubeHero videoId={videoId} />
        ) : series.selected_backdrop_url ? (
          <img src={series.selected_backdrop_url} alt={series.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: '#0a0a0a' }} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="px-4 space-y-7 pb-10">

        {/* Poster + title row */}
        <div className="flex gap-4 relative z-10 -mt-24 md:-mt-32">
          {series.selected_poster_url && (
            <div className="shrink-0 w-24 md:w-36 rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: '2/3' }}>
              <img src={series.selected_poster_url} alt={series.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-end pb-1 space-y-2">
            {series.selected_logo_url ? (
              <img src={series.selected_logo_url} alt={series.title} className="max-h-14 md:max-h-20 w-auto max-w-full object-contain object-left drop-shadow-2xl" />
            ) : (
              <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">{series.title}</h1>
            )}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-white/40">
              {series.first_air_date && <span>{series.first_air_date.slice(0, 4)}</span>}
              {series.tmdb_rating && <><span className="text-white/15">·</span><span className="flex items-center gap-1 font-semibold text-white"><Star size={10} className="text-yellow-400" fill="currentColor" />{series.tmdb_rating}</span></>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {videoId && (
            <button onClick={() => setTrailerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--accent)' }}>
              <Play size={13} fill="currentColor" />
              {trailerOpen ? 'Hide Trailer' : 'Trailer'}
              <ChevronDown size={13} className={`transition-transform duration-300 ${trailerOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button onClick={toggleWatchlist}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${inWatchlist ? 'text-accent' : 'text-white/60 hover:text-white'}`}
            style={{ background: 'var(--surface)' }}>
            {inWatchlist ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {inWatchlist ? 'Saved' : 'Watchlist'}
          </button>
          <button onClick={toggleWatched}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${isWatched ? 'text-green-400' : 'text-white/60 hover:text-white'}`}
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
                className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold text-white/55 hover:text-white transition-colors"
                style={{ background: 'var(--surface)' }}>
                {g.name}
              </Link>
            ))}
          </div>
        )}

        {/* Overview */}
        {series.overview && (
          <Expandable
            preview={<p className="text-sm leading-relaxed text-white/55 line-clamp-4">{series.overview}</p>}
            label="Read more" collapseLabel="Show less">
            <p className="text-sm leading-relaxed text-white/55">{series.overview}</p>
          </Expandable>
        )}

        {/* Inline Trailer */}
        {videoId && trailerOpen && (
          <div className="overflow-hidden rounded-2xl bg-black">
            <div className="aspect-video w-full">
              <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; fullscreen" allowFullScreen title={`${series.title} trailer`}
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
                    className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5 transition-colors hover:brightness-125"
                    style={{ background: 'var(--surface)' }}>
                    {logo && <img src={logo} alt={name} className="h-5 w-auto max-w-[56px] object-contain" />}
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

        {/* Similar */}
        <ContentGrid
          title="More Like This"
          items={similarSeries.map((s) => ({ id: s.id, title: s.title, to: `/series/${s.id}`, imageUrl: s.selected_poster_url, logoUrl: s.selected_logo_url, badge: s.tmdb_rating ? `★ ${s.tmdb_rating}` : null }))}
          aspect="poster" showLogo={false}
        />

        {/* Reviews */}
        <Section title="Reviews">
          <div className="space-y-3">
            {user ? (
              <div className="space-y-3 rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
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
              <div className="rounded-2xl p-4 text-sm text-white/35" style={{ background: 'var(--surface)' }}>
                <Link to="/login" className="text-accent hover:opacity-80 font-semibold">Log in</Link> to write a review.
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-white/35">User {r.user_id.slice(0, 8)}</div>
                  <span className="text-[10px] text-white/20">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-white/55 leading-relaxed">{r.review_text}</p>
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
          <div className="h-16 w-16 overflow-hidden rounded-2xl" style={{ background: 'var(--surface2)' }}>
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg font-black text-white/20">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-[10px] font-semibold leading-tight">{c.person.name}</div>
          {(sub === 'character' ? c.character : c.job) && (
            <div className="w-full truncate text-[9px] text-white/30">{sub === 'character' ? c.character : c.job}</div>
          )}
        </Link>
      ))}
    </div>
  )
}
