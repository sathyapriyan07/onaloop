import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Hero from '../ui/Hero'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import Expandable from '../ui/Expandable'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../lib/useSession'

type Series = {
  id: string
  title: string
  overview: string | null
  first_air_date: string | null
  tmdb_rating: number | null
  trailer_url: string | null
  videos: Array<{ key: string; name: string; type: string }>
  selected_backdrop_url: string | null
  backdrop_images: unknown
  selected_logo_url: string | null
  title_logos: unknown
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

function youtubeEmbedUrl(url: string) {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null
}

export default function SeriesDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const [series, setSeries] = useState<Series | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [credits, setCredits] = useState<CreditRow[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function run() {
      if (!id) return

      const { data: row } = await supabase
        .from('series')
        .select('id,title,overview,first_air_date,tmdb_rating,trailer_url,videos,selected_backdrop_url,backdrop_images,selected_logo_url,title_logos')
        .eq('id', id)
        .maybeSingle()
      if (!isMounted) return
      setSeries((row ?? null) as Series | null)

      const { data: genreRows } = await supabase
        .from('series_genres').select('genre:genres(id,name)').eq('series_id', id)
      if (!isMounted) return
      setGenres(((genreRows ?? []).map((r: any) => r.genre).filter(Boolean)) as Genre[])

      const { data: creditRows } = await supabase
        .from('credits')
        .select('id,credit_type,character,job,sort_order,person:people(id,name,selected_profile_url)')
        .eq('series_id', id)
        .order('sort_order', { ascending: true })
      if (!isMounted) return
      setCredits((creditRows ?? []) as unknown as CreditRow[])

      const { data: reviewRows } = await supabase
        .from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)')
        .eq('series_id', id).order('created_at', { ascending: false })
      if (!isMounted) return
      setReviews((reviewRows ?? []) as unknown as Review[])

      const { data: streamingRows } = await supabase
        .from('series_streaming_links').select('id,label,url,platform:platforms(name,logo_url)').eq('series_id', id).order('sort_order')
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
      const { error } = await supabase.from('reviews').insert({ user_id: user.id, series_id: id, review_text: reviewText.trim() })
      if (error) throw error
      setReviewText('')
      const { data } = await supabase.from('reviews').select('id,user_id,rating,review_text,created_at,profile:profiles(email)').eq('series_id', id).order('created_at', { ascending: false })
      setReviews((data ?? []) as unknown as Review[])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!series) return <div className="text-white/60">Loading…</div>

  const cast = credits.filter((c) => c.credit_type === 'cast')
  const crew = credits.filter((c) => c.credit_type === 'crew')
  const embedUrl = series.trailer_url ? youtubeEmbedUrl(series.trailer_url) : null
  const videos = (series.videos ?? []) as Array<{ key: string; name: string; type: string }>

  return (
    <div className="space-y-6">
      <Hero
        title={series.title}
        backdropUrl={series.selected_backdrop_url}
        backdropImages={series.backdrop_images}
        logoUrl={series.selected_logo_url}
        titleLogos={series.title_logos}
      />

      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{series.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
          {series.first_air_date ? <span>{series.first_air_date.slice(0, 4)}</span> : null}
          {series.tmdb_rating ? <span className="flex items-center gap-1">★ {series.tmdb_rating}</span> : null}
          {genres.length ? <span>{genres.map((g) => g.name).join(' · ')}</span> : null}
        </div>
        {series.overview ? (
          <Expandable
            preview={<p className="text-sm leading-relaxed text-white/70 line-clamp-3">{series.overview}</p>}
            label="Read more"
            collapseLabel="Show less"
          >
            <p className="text-sm leading-relaxed text-white/70">{series.overview}</p>
          </Expandable>
        ) : null}
        {embedUrl ? (
          <div className="pt-1">
            {showTrailer ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
                <iframe src={embedUrl} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen title="Trailer" />
              </div>
            ) : (
              <button onClick={() => setShowTrailer(true)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                ▶ Watch Trailer
              </button>
            )}
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

      {cast.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Cast</h2>
          <Expandable
            preview={
              <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cast.slice(0, 8).map((c) => c.person && (
                  <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
                      {c.person.selected_profile_url ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
                    </div>
                    <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
                    {c.character ? <div className="w-full truncate text-xs text-white/50">{c.character}</div> : null}
                  </Link>
                ))}
              </div>
            }
            label={`Show all ${cast.length}`}
            collapseLabel="Show less"
          >
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {cast.map((c) => c.person && (
                <Link key={c.id} to={`/person/${c.person.id}`} className="flex w-20 shrink-0 flex-col items-center gap-1 text-center">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-white/10">
                    {c.person.selected_profile_url ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg text-white/30">{c.person.name[0]}</div>}
                  </div>
                  <div className="w-full truncate text-xs font-medium">{c.person.name}</div>
                  {c.character ? <div className="w-full truncate text-xs text-white/50">{c.character}</div> : null}
                </Link>
              ))}
            </div>
          </Expandable>
        </section>
      ) : null}

      {crew.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Crew</h2>
          <Expandable
            preview={
              <div className="flex flex-wrap gap-3">
                {crew.slice(0, 6).map((c) => c.person && (
                  <Link key={c.id} to={`/person/${c.person.id}`} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10 shrink-0">
                      {c.person.selected_profile_url ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <div className="text-xs font-medium">{c.person.name}</div>
                      {c.job ? <div className="text-xs text-white/50">{c.job}</div> : null}
                    </div>
                  </Link>
                ))}
              </div>
            }
            label={`Show all ${crew.length}`}
            collapseLabel="Show less"
          >
            <div className="flex flex-wrap gap-3">
              {crew.map((c) => c.person && (
                <Link key={c.id} to={`/person/${c.person.id}`} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10 shrink-0">
                    {c.person.selected_profile_url ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div>
                    <div className="text-xs font-medium">{c.person.name}</div>
                    {c.job ? <div className="text-xs text-white/50">{c.job}</div> : null}
                  </div>
                </Link>
              ))}
            </div>
          </Expandable>
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
                  <img src={`https://img.youtube.com/vi/${v.key}/mqdefault.jpg`} alt={v.name} className="h-24 w-40 object-cover" />
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
              <iframe src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`} className="h-full w-full" allow="autoplay; fullscreen" allowFullScreen title="Video" />
            </div>
          ) : null}
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
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-white/70">{(r.profile as any)?.email ?? 'Anonymous'}</div>
                <div className="text-xs text-white/40">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-sm text-white/80">{r.review_text}</div>
            </div>
          ))}
          {!reviews.length ? <div className="text-sm text-white/50">No reviews yet.</div> : null}
        </div>
      </section>
    </div>
  )
}
