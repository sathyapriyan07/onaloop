import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import DomeGallery from '../ui/DomeGallery'

type Item = { id: string; title: string; selected_poster_url: string | null; _type: 'movie' | 'series' }

export default function DiscoverPage() {
  const [images, setImages] = useState<{ src: string; alt: string; id: string; type: 'movie' | 'series' }[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('movies').select('id,title,selected_poster_url').not('selected_poster_url', 'is', null).limit(60),
      supabase.from('series').select('id,title,selected_poster_url').not('selected_poster_url', 'is', null).limit(30),
    ]).then(([{ data: movies }, { data: series }]) => {
      const items: typeof images = [
        ...((movies ?? []) as Item[]).map((m) => ({ src: m.selected_poster_url!, alt: m.title, id: m.id, type: 'movie' as const })),
        ...((series ?? []) as Item[]).map((s) => ({ src: s.selected_poster_url!, alt: s.title, id: s.id, type: 'series' as const })),
      ]
      setImages(items)
    })
  }, [])

  return (
    <div className="fixed inset-0 z-0" style={{ height: '100dvh' }}>
      {images.length > 0 && (
        <DomeGallery
          images={images}
          fit={0.85}
          minRadius={500}
          maxVerticalRotationDeg={8}
          segments={34}
          dragDampening={2}
          grayscale={false}
          overlayBlurColor="var(--bg, #0a0a0a)"
        />
      )}
      <div className="absolute inset-x-0 top-0 flex items-center justify-center pt-6 pointer-events-none z-10">
        <div className="rounded-2xl bg-black/40 px-4 py-2 backdrop-blur">
          <p className="text-xs text-white/60">Drag to explore · Tap to open</p>
        </div>
      </div>
    </div>
  )
}
