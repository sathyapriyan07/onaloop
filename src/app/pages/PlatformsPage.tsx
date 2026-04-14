import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Platform = { id: string; name: string; logo_url: string | null; display_image_url: string | null; category: 'ott' | 'music' }
type Tab = 'ott' | 'music'

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('ott')

  useEffect(() => {
    supabase.from('platforms').select('id,name,logo_url,display_image_url,category').order('name')
      .then(({ data }) => { setPlatforms((data ?? []) as Platform[]); setLoading(false) })
  }, [])

  const filtered = platforms.filter((p) => p.category === tab)

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-black tracking-tight">Platforms</h1>

      <div className="flex gap-1.5">
        {(['ott', 'music'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors"
            style={tab === t ? { background: 'var(--surface2)', color: '#fff' } : { background: 'var(--surface)', color: 'rgba(255,255,255,0.5)' }}>
            {t === 'ott' ? 'Streaming' : 'Music'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[16/9] rounded-xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-sm text-white/30">None yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <Link key={p.id} to={`/platform/${p.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[16/9] bg-[#1c1c1e]">
              {p.display_image_url
                ? <img src={p.display_image_url} alt={p.name} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                : <div className="h-full w-full" style={{ background: 'var(--surface2)' }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                <div className="text-sm font-bold truncate">{p.name}</div>
                {p.logo_url && <img src={p.logo_url} alt="" className="h-5 w-auto max-w-[40px] object-contain opacity-80 shrink-0" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
