import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Props = { items: unknown[] }

export default function HomeBanner(_props: Props) {
  const [posters, setPosters] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('hero_collage')
      .select('movie:movies(selected_poster_url)')
      .order('sort_order')
      .then(({ data }) => {
        if (!data?.length) {
          // fallback: latest movies
          supabase.from('movies').select('selected_poster_url').not('selected_poster_url','is',null).order('created_at',{ascending:false}).limit(24)
            .then(({ data: fb }) => { if (fb?.length) setPosters((fb as any[]).map((m) => m.selected_poster_url)) })
          return
        }
        setPosters((data as any[]).map((r) => { const m = Array.isArray(r.movie) ? r.movie[0] : r.movie; return m?.selected_poster_url }).filter(Boolean))
      })
  }, [])

  // Split posters into 6 columns, cycling if not enough
  const cols = 6
  const perCol = 4
  const columns = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: perCol }, (_, r) => posters[(c * perCol + r) % (posters.length || 1)])
  )

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/5" style={{ background: '#161616', minHeight: 260 }}>

      {/* Full-bleed poster grid */}
      {posters.length > 0 && (
        <div className="absolute inset-0 flex gap-1.5 p-1.5 overflow-hidden">
          {columns.map((col, ci) => (
            <div
              key={ci}
              className="flex flex-1 flex-col gap-1.5"
              style={{ marginTop: ci % 2 === 1 ? '-20px' : '0px' }}
            >
              {col.map((url, ri) => (
                <img
                  key={ri}
                  src={url}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[2/3] object-cover rounded-lg shrink-0"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Gradient overlay — left heavy so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/75 to-neutral-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent" />

      {/* Tagline + buttons */}
      <div className="relative flex flex-col justify-end gap-3 p-5 md:p-8 min-h-[260px] md:min-h-[320px]">
        <div className="text-2xl md:text-4xl font-black tracking-tight max-w-[260px] md:max-w-sm leading-tight">
          Discover. Track. <span className="text-accent">Loop</span> your favorites.
        </div>
        <p className="text-xs text-white/50 max-w-xs">Your personal movie discovery platform.</p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <Link
            to="/movies"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)' }}
          >
            <Play size={13} fill="currentColor" /> Explore Movies
          </Link>
          <button
            onClick={() => navigate('/discover')}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/15 transition-colors"
          >
            <TrendingUp size={13} /> Trending Now
          </button>
        </div>
      </div>
    </section>
  )
}
