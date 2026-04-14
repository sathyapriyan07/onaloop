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

  const cardW = aspect === 'poster'
    ? 'w-[38vw] max-w-[160px] md:max-w-[175px]'
    : 'w-[68vw] max-w-[320px]'

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold tracking-tight">
          {emoji && <span className="mr-1.5">{emoji}</span>}{title}
        </h2>
        <div className="flex items-center gap-1.5">
          {viewAllTo && (
            <Link to={viewAllTo} className="flex items-center gap-0.5 text-[11px] font-semibold text-accent hover:opacity-80 transition-opacity">
              See All <ArrowRight size={11} />
            </Link>
          )}
          <div className="hidden md:flex gap-0.5">
            <button ref={prevBtnRef} onClick={() => emblaApi?.scrollPrev()}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-white/50 hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={13} />
            </button>
            <button ref={nextBtnRef} onClick={() => emblaApi?.scrollNext()}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-white/50 hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
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
              className={`group relative shrink-0 overflow-hidden rounded-xl ${cardW} ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}
              style={{ background: 'var(--surface)' }}
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-white/30">{item.title}</div>
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-2">
                {showLogo && item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.title} className="max-h-6 max-w-[85%] object-contain object-left drop-shadow-md" />
                ) : (
                  <div className="line-clamp-2 text-[11px] font-semibold leading-tight">{item.title}</div>
                )}
                {(item.sub || item.year) && (
                  <div className="mt-0.5 text-[10px] text-white/40 truncate">{item.sub ?? item.year}</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
