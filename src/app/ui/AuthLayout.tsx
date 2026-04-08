import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import DomeGallery from './DomeGallery'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [images, setImages] = useState<{ src: string; alt: string }[]>([])

  useEffect(() => {
    supabase
      .from('movies')
      .select('id,title,selected_poster_url')
      .not('selected_poster_url', 'is', null)
      .limit(40)
      .then(({ data }) => {
        setImages(
          (data ?? [])
            .filter((m: any) => m.selected_poster_url)
            .map((m: any) => ({ src: m.selected_poster_url, alt: m.title }))
        )
      })
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden bg-neutral-950">
      <div className="absolute inset-0">
        {images.length > 0 && (
          <DomeGallery
            images={images}
            fit={0.8}
            minRadius={600}
            maxVerticalRotationDeg={0}
            segments={34}
            dragDampening={2}
            grayscale={false}
            overlayBlurColor="#0a0a0a"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/80" />
      <div className="relative z-10 flex min-h-dvh items-end justify-center p-6 pb-12">
        {children}
      </div>
    </div>
  )
}
