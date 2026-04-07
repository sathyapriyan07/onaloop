import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Hero from '../ui/Hero'
import Button from '../ui/Button'
import TextArea from '../ui/TextArea'
import { supabase } from '../../lib/supabase'
import { formatRuntime } from '../../lib/format'
import { useSession } from '../../lib/useSession'

type Movie = {
  id: string
  title: string
  overview: string | null
  release_date: string | null
  runtime_minutes: number | null
  selected_backdrop_url: string | null
  backdrop_images: unknown
  selected_logo_url: string | null
  title_logos: unknown
  selected_poster_url: string | null
}

type Genre = { id: string; name: string }

type Review = {
  id: string
  user_id: string
  rating: number | null
  review_text: string
  created_at: string
}

type LinkRow = { id: string; label: string; url: string }

export default function MovieDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [musicLinks, setMusicLinks] = useState<LinkRow[]>([])
  const [streamingLinks, setStreamingLinks] = useState<LinkRow[]>([])
  const [reviewText, setReviewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function run() {
      if (!id) return

      const { data: movieRow } = await supabase
        .from('movies')
        .select(
          'id,title,overview,release_date,runtime_minutes,selected_backdrop_url,backdrop_images,selected_logo_url,title_logos,selected_poster_url',
        )
        .eq('id', id)
        .maybeSingle()

      if (!isMounted) return
      setMovie((movieRow ?? null) as Movie | null)

      const { data: genreRows } = await supabase
        .from('movie_genres')
        .select('genre:genres(id,name)')
        .eq('movie_id', id)

      if (!isMounted) return
      setGenres(((genreRows ?? []).map((r: any) => r.genre).filter(Boolean) as Genre[]) ?? [])

      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('id,user_id,rating,review_text,created_at')
        .eq('movie_id', id)
        .order('created_at', { ascending: false })

      if (!isMounted) return
      setReviews((reviewRows ?? []) as Review[])

      const { data: musicRows } = await supabase
        .from('movie_music_links')
        .select('id,label,url')
        .eq('movie_id', id)
        .order('sort_order', { ascending: true })

      if (!isMounted) return
      setMusicLinks((musicRows ?? []) as LinkRow[])

      const { data: streamingRows } = await supabase
        .from('movie_streaming_links')
        .select('id,label,url')
        .eq('movie_id', id)
        .order('sort_order', { ascending: true })

      if (!isMounted) return
      setStreamingLinks((streamingRows ?? []) as LinkRow[])
    }

    run()
    return () => {
      isMounted = false
    }
  }, [id])

  const meta = useMemo(() => {
    if (!movie) return null
    return (
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
        {movie.release_date ? <span>{movie.release_date.slice(0, 4)}</span> : null}
        {formatRuntime(movie.runtime_minutes) ? <span>{formatRuntime(movie.runtime_minutes)}</span> : null}
        {genres.length ? <span>{genres.map((g) => g.name).join(' · ')}</span> : null}
      </div>
    )
  }, [movie, genres])

  async function submitReview() {
    if (!id || !user) return
    if (!reviewText.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        movie_id: id,
        review_text: reviewText.trim(),
      })
      if (error) throw error
      setReviewText('')

      const { data: reviewRows } = await supabase
        .from('reviews')
        .select('id,user_id,rating,review_text,created_at')
        .eq('movie_id', id)
        .order('created_at', { ascending: false })
      setReviews((reviewRows ?? []) as Review[])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!movie) return <div className="text-white/60">Loading…</div>

  return (
    <div className="space-y-6">
      <Hero
        title={movie.title}
        backdropUrl={movie.selected_backdrop_url}
        backdropImages={movie.backdrop_images}
        logoUrl={movie.selected_logo_url}
        titleLogos={movie.title_logos}
      />

      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{movie.title}</h1>
        {meta}
        {movie.overview ? <p className="text-sm leading-relaxed text-white/70">{movie.overview}</p> : null}
      </section>

      {streamingLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Streaming</h2>
          <div className="flex flex-wrap gap-2">
            {streamingLinks.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {musicLinks.length ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight">Music</h2>
          <div className="flex flex-wrap gap-2">
            {musicLinks.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Reviews</h2>

        {user ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
            <TextArea
              placeholder="Write a review…"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button disabled={isSubmitting || !reviewText.trim()} onClick={submitReview}>
                Post review
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Log in to add a review.
          </div>
        )}

        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/50">{new Date(r.created_at).toLocaleString()}</div>
              <div className="mt-2 text-sm text-white/80">{r.review_text}</div>
            </div>
          ))}
          {!reviews.length ? <div className="text-sm text-white/50">No reviews yet.</div> : null}
        </div>
      </section>
    </div>
  )
}

