import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DomeGallery from '../ui/DomeGallery'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<{ src: string; alt: string; id: string }[]>([])

  useEffect(() => {
    Promise.all([
      supabase.from('movies').select('id,title,selected_backdrop_url').not('selected_backdrop_url', 'is', null).limit(60),
      supabase.from('series').select('id,title,selected_backdrop_url').not('selected_backdrop_url', 'is', null).limit(30),
    ]).then(([{ data: movies }, { data: series }]) => {
      setImages([
        ...((movies ?? []) as any[]).map((m) => ({ src: m.selected_backdrop_url, alt: m.title, id: `movie:${m.id}` })),
        ...((series ?? []) as any[]).map((s) => ({ src: s.selected_backdrop_url, alt: s.title, id: `series:${s.id}` })),
      ])
    })
  }, [])

  const onSelect = useCallback((id: string) => {
    const [type, contentId] = id.split(':')
    navigate(type === 'movie' ? `/movie/${contentId}` : `/series/${contentId}`)
  }, [navigate])

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
          onSelect={onSelect}
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
