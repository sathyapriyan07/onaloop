import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Platform = {
  id: string
  name: string
  logo_url: string | null
  display_image_url: string | null
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('platforms')
        .select('id,name,logo_url,display_image_url')
        .order('name', { ascending: true })
      if (!isMounted) return
      setPlatforms((data ?? []) as Platform[])
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Platforms</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {platforms.map((p) => (
          <div
            key={p.id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="aspect-[16/10] w-full">
              {p.display_image_url ? (
                <img src={p.display_image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-3">
              <div className="text-sm font-semibold tracking-tight">{p.name}</div>
              {p.logo_url ? <img src={p.logo_url} alt="" className="h-6 w-auto opacity-80" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

