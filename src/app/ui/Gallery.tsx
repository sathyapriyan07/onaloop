import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  images: string[]
  title: string
}

export default function Gallery({ images, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images.length) return null

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)
  const nextImage = () => setLightboxIndex((prev) => prev !== null ? (prev + 1) % images.length : 0)
  const prevImage = () => setLightboxIndex((prev) => prev !== null ? (prev - 1 + images.length) % images.length : 0)

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Gallery</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors"
            >
              <img
                src={imageUrl}
                alt={`${title} gallery image ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <span className="text-white text-lg">🔍</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt={`${title} gallery image ${lightboxIndex + 1}`}
            className="max-h-full max-w-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}

          {/* Background click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeLightbox}
          />
        </div>
      )}
    </>
  )
}