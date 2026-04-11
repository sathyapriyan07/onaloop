import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SpotlightCard from '../ui/SpotlightCard'
import { supabase } from '../../lib/supabase'

type PH = { id: string; name: string; logo_url: string | null; display_image_url: string | null }

export default function ProductionHousesPage() {
  const [items, setItems] = useState<PH[]>([])

  useEffect(() => {
    let isMounted = true
    supabase.from('production_houses').select('id,name,logo_url,display_image_url').order('name')
      .then(({ data }) => { if (isMounted) setItems((data ?? []) as PH[]) })
    return () => { isMounted = false }
  }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Production Houses</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((p) =>
          p.display_image_url ? (
            <Link key={p.id} to={`/studio/${p.id}`} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 block">
              <div className="aspect-[16/10] w-full">
                <img src={p.display_image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3">
                <div className="text-sm font-semibold tracking-tight">{p.name}</div>
                {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto opacity-80" /> : null}
              </div>
            </Link>
          ) : (
            <Link key={p.id} to={`/studio/${p.id}`}>
              <SpotlightCard className="aspect-[16/10] flex items-center justify-between gap-3 p-3">
                <div className="text-sm font-semibold tracking-tight">{p.name}</div>
                {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto opacity-80" /> : null}
              </SpotlightCard>
            </Link>
          )
        )}
        {!items.length ? <div className="col-span-full text-sm text-white/50">No production houses yet.</div> : null}
      </div>
    </div>
  )
}
