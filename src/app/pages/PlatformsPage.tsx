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
    <div className="space-y-5 pt-4">
      <h1 className="text-xl font-bold tracking-tight">Platforms</h1>
      <div className="flex gap-2">
        {(['ott', 'music'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={['rounded-lg px-4 py-1.5 text-xs font-bold transition-colors', tab === t ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}
            style={tab !== t ? { background: '#1a1a1a' } : {}}>
            {t === 'ott' ? 'OTT' : 'Music'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[16/10] rounded-xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-white/40 text-center py-10">None yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((p) => (
            <Link key={p.id} to={`/platform/${p.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[16/10]"
              style={{ background: '#161616' }}>
              {p.display_image_url
                ? <img src={p.display_image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                : <div className="h-full w-full" style={{ background: '#1e1e1e' }} />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2.5">
                <div className="text-xs font-bold truncate">{p.name}</div>
                {p.logo_url ? <img src={p.logo_url} alt="" className="h-5 w-auto max-w-[40px] object-contain opacity-80 shrink-0" /> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
