import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import DomeGallery from '../ui/DomeGallery'

export default function DiscoverPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState<{ src: string; alt: string; id: string }[]>([])

  useEffect(() => {
    async function load() {
      const fetchAll = async (table: 'movies' | 'series') => {
        const all: any[] = []
        const pageSize = 1000
        let from = 0
        while (true) {
          const { data } = await supabase.from(table).select('id,title,selected_backdrop_url').not('selected_backdrop_url', 'is', null).order('title').range(from, from + pageSize - 1)
          if (!data || data.length === 0) break
          all.push(...data)
          if (data.length < pageSize) break
          from += pageSize
        }
        return all
      }
      const [movies, series] = await Promise.all([fetchAll('movies'), fetchAll('series')])
      setImages([
        ...movies.map((m) => ({ src: m.selected_backdrop_url, alt: m.title, id: `movie:${m.id}` })),
        ...series.map((s) => ({ src: s.selected_backdrop_url, alt: s.title, id: `series:${s.id}` })),
      ])
    }
    load()
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
