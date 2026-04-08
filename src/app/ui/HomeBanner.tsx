import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
  const startX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (items.length <= 1) return
    const t = setInterval(() => setActive((i) => (i + 1) % items.length), 5000)
    return () => clearInterval(t)
  }, [items.length])

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current
    if (Math.abs(dx) < 40) return
    if (dx < 0) setActive((i) => (i + 1) % items.length)
    else setActive((i) => (i - 1 + items.length) % items.length)
  }

  if (!items.length) return null
  const item = items[active]

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Link to={item.to} className="block">
        <div className="relative aspect-[16/9] w-full">
          {item.backdropUrl ? (
            <img
              key={item.id}
              src={item.backdropUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/0" />
          <div className="absolute inset-x-0 bottom-0 p-4 space-y-1">
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt={item.title}
                className="max-h-14 w-auto max-w-[70%] object-contain drop-shadow-[0_12px_26px_rgba(0,0,0,0.7)]"
              />
            ) : (
              <div className="text-xl font-semibold tracking-tight text-white">{item.title}</div>
            )}
            {item.overview ? (
              <p className="line-clamp-2 text-xs text-white/60 max-w-[85%]">{item.overview}</p>
            ) : null}
          </div>
        </div>
      </Link>

      {items.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={[
                'h-1.5 rounded-full transition-all',
                i === active ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
              ].join(' ')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
