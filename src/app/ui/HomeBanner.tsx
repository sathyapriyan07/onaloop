import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const perCol = 6
  const columns = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: perCol }, (_, r) => posters[(c * perCol + r) % (posters.length || 1)])
  )

  const resolvedPosters = useMemo(() => posters.filter(Boolean), [posters])
  const show = resolvedPosters.length > 0

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--surface)', minHeight: 440 }}>
      {show && (
        <div className="absolute inset-0 flex gap-1 p-1 overflow-hidden opacity-70">
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

      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, var(--bg) 96%)' }} />

      <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />

      <button
        type="button"
        onClick={() => navigate('/discover')}
        className="absolute left-1/2 -translate-x-1/2 bottom-16 rounded-full px-14 py-3.5 text-[18px] font-black tracking-tight shadow-[0_18px_70px_rgba(0,0,0,0.35)] hover:opacity-90 transition-opacity"
        style={{ background: 'var(--label)', color: 'var(--bg)' }}
      >
        Explore
      </button>
    </section>
  )
}
