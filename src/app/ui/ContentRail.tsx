import { useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react'

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
  emoji?: string
}

export default function ContentRail({ title, items, aspect = 'poster', showLogo = true, viewAllTo, emoji }: Props) {
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

  const cardClass = aspect === 'poster'
    ? 'aspect-[2/3] w-[36vw] max-w-[160px] md:max-w-[180px]'
    : 'aspect-[16/9] w-[65vw] max-w-[300px]'

  return (
    <section className="space-y-4">
      {/* Section header — elfilming style: accent left bar + bold title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-1 h-5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
          <h2 className="text-base font-black tracking-tight uppercase flex items-center gap-2">
            {emoji && <span className="text-sm">{emoji}</span>}
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllTo && (
            <Link to={viewAllTo} className="flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-accent transition-colors">
              See All <ArrowRight size={11} />
            </Link>
          )}
          <div className="flex gap-1">
            <button ref={prevBtnRef} onClick={() => emblaApi?.scrollPrev()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            <button ref={nextBtnRef} onClick={() => emblaApi?.scrollNext()}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden -mx-4" ref={emblaRef}>
        <div className="flex gap-3 px-4 pb-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`group relative shrink-0 overflow-hidden rounded-xl bg-neutral-900 ${cardClass}`}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/30">{item.title}</div>
              )}

              {/* Gradient */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Rating badge — top left */}
              {(item.badge || item.rating) && (
                <div className="absolute left-2 top-2 flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
                  <Star size={8} className="text-yellow-400" fill="currentColor" />
                  <span>{item.rating ?? item.badge}</span>
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                {showLogo && item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.title} className="max-h-7 max-w-[85%] object-contain object-left drop-shadow-md" />
                ) : (
                  <div className="line-clamp-2 text-xs font-bold leading-tight">{item.title}</div>
                )}
                {item.sub && <div className="mt-0.5 text-[10px] text-white/50 truncate">{item.sub}</div>}
                {item.year && !item.sub && <div className="mt-0.5 text-[10px] text-white/40">{item.year}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
