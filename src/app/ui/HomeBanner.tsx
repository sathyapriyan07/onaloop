import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, Compass } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type Props = { items: unknown[] }

export default function HomeBanner(_props: Props) {
  const [posters, setPosters] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('hero_collage').select('movie:movies(selected_poster_url)').order('sort_order')
      .then(({ data }) => {
        if (!data?.length) {
          supabase.from('movies').select('selected_poster_url').not('selected_poster_url', 'is', null)
            .order('created_at', { ascending: false }).limit(24)
            .then(({ data: fb }) => { if (fb?.length) setPosters((fb as any[]).map((m) => m.selected_poster_url)) })
          return
        }
        setPosters((data as any[]).map((r) => { const m = Array.isArray(r.movie) ? r.movie[0] : r.movie; return m?.selected_poster_url }).filter(Boolean))
      })
  }, [])

  const cols = 7
  const perCol = 5
  const columns = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: perCol }, (_, r) => posters[(c * perCol + r) % (posters.length || 1)])
  )

  return (
    <section className="relative overflow-hidden rounded-2xl" style={{ background: '#111', minHeight: 300 }}>
      {posters.length > 0 && (
        <div className="absolute inset-0 flex gap-1 p-1 overflow-hidden opacity-60">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-1"
              style={{ marginTop: ci % 2 === 1 ? '-24px' : ci % 3 === 2 ? '-12px' : '0px' }}>
              {col.map((url, ri) => (
                <img key={ri} src={url} alt="" loading="lazy"
                  className="w-full aspect-[2/3] object-cover rounded-lg shrink-0" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      <div className="relative flex flex-col justify-end gap-4 p-6 md:p-10 min-h-[300px] md:min-h-[380px]">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Your personal cinema</div>
          <div className="text-3xl md:text-5xl font-black tracking-tight max-w-sm leading-[1.1]">
            Discover. Track. <span className="text-accent">Loop.</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link to="/movies"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)' }}>
            <Play size={13} fill="currentColor" /> Explore Movies
          </Link>
          <button onClick={() => navigate('/discover')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
            <Compass size={13} /> Discover
          </button>
        </div>
      </div>
    </section>
  )
}
