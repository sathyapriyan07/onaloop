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
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  })

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
    ? 'aspect-[2/3] w-[32vw] max-w-[150px] md:max-w-[170px]'
    : 'aspect-[16/9] w-[60vw] max-w-[280px]'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          {emoji && <span>{emoji}</span>}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-accent transition-colors"
            >
              View All <ArrowRight size={12} />
            </Link>
          )}
          <div className="flex gap-1">
            <button
              ref={prevBtnRef}
              onClick={() => emblaApi?.scrollPrev()}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              ref={nextBtnRef}
              onClick={() => emblaApi?.scrollNext()}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden -mx-4" ref={emblaRef}>
        <div className="flex gap-3 px-4 pb-2">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={`group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors duration-300 hover:border-white/25 ${cardClass}`}
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/40">
                  {item.title}
                </div>
              )}

              {/* gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="space-y-1">
                  {showLogo && item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.title} className="max-h-6 max-w-[80%] object-contain object-left drop-shadow-md" />
                  ) : (
                    <div className="line-clamp-2 text-xs font-semibold leading-tight">{item.title}</div>
                  )}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-white/60">
                    {item.rating ? <span className="flex items-center gap-0.5"><Star size={8} className="text-yellow-400" fill="currentColor" />{item.rating}</span> : null}
                    {item.year ? <span>{item.year}</span> : null}
                    {item.loopScore != null ? <span className="text-accent">🔁{item.loopScore}</span> : null}
                  </div>
                </div>
              </div>

              {/* default bottom info */}
              <div className="absolute inset-x-0 bottom-0 p-2 transition-opacity duration-300 group-hover:opacity-0">
                {showLogo && item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.title} className="max-h-7 max-w-[80%] object-contain object-left drop-shadow-md" />
                ) : (
                  <div className="line-clamp-2 text-xs font-semibold leading-tight">{item.title}</div>
                )}
                {item.sub ? <div className="mt-0.5 text-[10px] text-white/50">{item.sub}</div> : null}
              </div>

              {/* badge */}
              {item.badge ? (
                <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                  {item.badge}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
