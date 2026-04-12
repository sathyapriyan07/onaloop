import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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
      {/* Static background with movie posters */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-6 gap-2 h-full opacity-20">
          {images.slice(0, 24).map((image, index) => (
            <div key={index} className="aspect-[2/3] overflow-hidden rounded-lg">
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/80" />
      <div className="relative z-10 flex min-h-dvh items-end justify-center p-6 pb-12">
        {children}
      </div>
    </div>
  )
}
