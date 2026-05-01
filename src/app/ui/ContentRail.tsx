import { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

export type ContentRailItem = {
  id: string
  title: string
  to: string
  imageUrl: string | null
  logoUrl?: string | null
  badge?: string | null
  sub?: string | null
  rating?: number | null
  year?: string | null
  loopScore?: number | null
}

type Props = {
  title: string
  items: ContentRailItem[]
  aspect?: 'poster' | 'backdrop'
  showLogo?: boolean
  viewAllTo?: string
}

export default function ContentRail({ title, items, aspect = 'poster', viewAllTo }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true, containScroll: 'trimSnaps' })
  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)

  const updateButtons = useCallback(() => {
    if (!emblaApi || !prevBtnRef.current || !nextBtnRef.current) return
    prevBtnRef.current.disabled = !emblaApi.canScrollPrev()
    nextBtnRef.current.disabled = !emblaApi.canScrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    updateButtons()
    emblaApi.on('select', updateButtons)
    emblaApi.on('reInit', updateButtons)
    return () => { emblaApi.off('select', updateButtons); emblaApi.off('reInit', updateButtons) }
  }, [emblaApi, updateButtons])

  if (!items.length) return null

  const cardW = aspect === 'poster'
    ? 'w-[38vw] max-w-[160px] md:max-w-[175px]'
    : 'w-[68vw] max-w-[320px]'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="otl-section-title text-[var(--label)]">{title}</h2>
        <div className="flex items-center gap-1.5">
          {viewAllTo && (
            <Link to={viewAllTo} className="flex items-center gap-0.5 text-[11px] font-semibold text-accent hover:opacity-80 transition-opacity">
              See All <ArrowRight size={11} />
            </Link>
          )}
          <div className="hidden md:flex gap-0.5">
            <button ref={prevBtnRef} onClick={() => emblaApi?.scrollPrev()}
              className="flex h-7 w-7 items-center justify-center rounded-full border text-[var(--label2)] hover:text-[var(--label)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              style={{ background: 'var(--surface2)', borderColor: 'var(--separator)' }}>
              <ChevronLeft size={13} />
            </button>
            <button ref={nextBtnRef} onClick={() => emblaApi?.scrollNext()}
              className="flex h-7 w-7 items-center justify-center rounded-full border text-[var(--label2)] hover:text-[var(--label)] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              style={{ background: 'var(--surface2)', borderColor: 'var(--separator)' }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden -mx-4" ref={emblaRef}>
        <div className="flex gap-2.5 px-4 pb-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`otl-card shrink-0 ${cardW} ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} loading="lazy"
                  className="h-full w-full object-cover" />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Title, overlay, and fallback removed as requested */}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
