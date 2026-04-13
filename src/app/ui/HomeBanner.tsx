import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

type BannerItem = {
  id: string
  to: string
  title: string
  backdropUrl: string | null
  logoUrl: string | null
  overview: string | null
}

type Props = { items: BannerItem[] }

export default function HomeBanner({ items }: Props) {
  const [active, setActive] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const startX = useRef(0)
  const navigate = useNavigate()

  function goTo(index: number) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setActive(index)
      setTransitioning(false)
    }, 200)
  }

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => goTo((active + 1) % items.length), 6000)
    return () => clearInterval(t)
  }, [items.length, active])

  function onTouchStart(e: React.TouchEvent) { startX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) < 40) return
    goTo(dx < 0 ? (active + 1) % items.length : (active - 1 + items.length) % items.length)
  }

  if (!items.length) return (
    <section className="relative overflow-hidden rounded-3xl bg-white/5 aspect-[16/9] md:aspect-[21/9]">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="text-3xl md:text-5xl font-black tracking-tight">
          Discover. Track. <span className="text-accent">Loop</span> your favorites.
        </div>
        <p className="text-sm text-white/50 max-w-sm">Your personal movie discovery platform.</p>
        <div className="flex gap-3">
          <Link to="/movies" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-950" style={{ background: 'var(--accent)' }}>
            <Play size={14} fill="currentColor" /> Explore Movies
          </Link>
          <Link to="/genres" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/15 transition-colors">
            <TrendingUp size={14} /> Trending Now
          </Link>
        </div>
      </div>
    </section>
  )

  const item = items[active]

  return (
    <section
      className="relative overflow-hidden rounded-3xl select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
        {/* Backdrop */}
        {item.backdropUrl ? (
          <img
            key={item.id}
            src={item.backdropUrl}
            alt={item.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-neutral-900 to-neutral-950" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-transparent to-transparent" />

        {/* Content */}
        <div className={`absolute inset-0 flex flex-col justify-end p-5 md:p-10 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className="max-w-lg space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Discover. Track. Loop your favorites.
            </p>
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt={item.title}
                className="max-h-16 md:max-h-20 w-auto max-w-[70%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">{item.title}</h1>
            )}
            {item.overview ? (
              <p className="line-clamp-2 text-xs md:text-sm text-white/60 max-w-sm">{item.overview}</p>
            ) : null}
            <div className="flex gap-3 pt-1">
              <Link
                to={item.to}
                className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                <Play size={14} fill="currentColor" /> Explore
              </Link>
              <button
                onClick={() => navigate('/movies')}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/15 transition-colors"
              >
                <TrendingUp size={14} /> Trending Now
              </button>
            </div>
          </div>
        </div>

        {/* Prev/Next arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => goTo((active - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur hover:bg-black/60 hover:text-white transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo((active + 1) % items.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur hover:bg-black/60 hover:text-white transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="absolute bottom-4 right-5 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === active ? 'w-5 bg-accent' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
