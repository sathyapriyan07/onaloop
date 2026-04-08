import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Poster = { id: string; url: string }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [posters, setPosters] = useState<Poster[]>([])

  useEffect(() => {
    supabase
      .from('movies')
      .select('id,selected_poster_url')
      .not('selected_poster_url', 'is', null)
      .limit(30)
      .then(({ data }) => {
        const p = (data ?? [])
          .filter((m: any) => m.selected_poster_url)
          .map((m: any) => ({ id: m.id, url: m.selected_poster_url }))
        setPosters(p)
      })
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden theme-bg">
      <div className="absolute inset-0 grid grid-cols-3 gap-2 p-2 opacity-20 blur-sm">
        {posters.map((p, i) => (
          <div
            key={p.id}
            className="aspect-[2/3] overflow-hidden rounded-2xl bg-white/5"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <img src={p.url} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />
      <div className="relative z-10 flex min-h-dvh items-center justify-center p-4">
        {children}
      </div>
    </div>
  )
}
