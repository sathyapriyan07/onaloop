import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SpotlightCard from '../ui/SpotlightCard'

type Platform = {
  id: string
  name: string
  logo_url: string | null
  display_image_url: string | null
  category: 'ott' | 'music'
}

type Tab = 'ott' | 'music'

function PlatformGrid({ platforms }: { platforms: Platform[] }) {
  if (!platforms.length) return <div className="text-sm text-white/50">None yet.</div>
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {platforms.map((p) =>
        p.display_image_url ? (
          <div key={p.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="aspect-[16/10] w-full">
              <img src={p.display_image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3">
              <div className="text-sm font-semibold tracking-tight">{p.name}</div>
              {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto opacity-80" /> : null}
            </div>
          </div>
        ) : (
          <SpotlightCard key={p.id} className="aspect-[16/10] flex items-center justify-between gap-3 p-3">
            <div className="text-sm font-semibold tracking-tight">{p.name}</div>
            {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto opacity-80" /> : null}
          </SpotlightCard>
        )
      )}
    </div>
  )
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [tab, setTab] = useState<Tab>('ott')

  useEffect(() => {
    let isMounted = true
    supabase.from('platforms').select('id,name,logo_url,display_image_url,category').order('name').then(({ data }) => {
      if (isMounted) setPlatforms((data ?? []) as Platform[])
    })
    return () => { isMounted = false }
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ott', label: 'OTT' },
    { key: 'music', label: 'Music' },
  ]

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Platforms</h1>
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={['rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors', tab === t.key ? 'bg-white text-neutral-950' : 'bg-white/10 text-white/60 hover:bg-white/15'].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <PlatformGrid platforms={platforms.filter((p) => p.category === tab)} />
    </div>
  )
}
