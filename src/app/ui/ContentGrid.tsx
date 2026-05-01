import { Link } from 'react-router-dom'
import { useState, useRef, useCallback, type CSSProperties } from 'react'

export type ContentGridItem = {
  id: string
  title: string
  to: string
  imageUrl: string | null
  logoUrl?: string | null
  badge?: string | null
  sub?: string | null
}

type Props = {
  title?: string
  items: ContentGridItem[]
  aspect?: 'poster' | 'backdrop'
  showLogo?: boolean
  colsClassName?: string
}

export default function ContentGrid({ title, items, aspect = 'poster', colsClassName }: Props) {
  if (!items.length) return null

  const gridClass = colsClassName ?? (aspect === 'poster'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')

  return (
    <section className="space-y-4">
      {title && <h2 className="otl-section-title text-[var(--label)]">{title}</h2>}
      <div className={`grid gap-5 ${gridClass}`}>
        {items.map((item) => (
          <ContentCard key={item.id} item={item} aspect={aspect} />
        ))}
      </div>
    </section>
  )
}

function ContentCard({ item, aspect }: { item: ContentGridItem; aspect: string }) {
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const tiltX = (0.5 - y) * 20
    const tiltY = (x - 0.5) * 20
    setTilt({ x: tiltX, y: tiltY })
    setShinePos({ x: x * 100, y: y * 100 })
  }, [])

  const handleMouseEnter = useCallback(() => setHovered(true), [])
  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setTilt({ x: 0, y: 0 })
  }, [])

  const isPoster = aspect === 'poster'

  const cardStyle: CSSProperties = {
    borderRadius: '14px',
    transform: hovered
      ? `scale(1.08) perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
      : 'scale(1) perspective(1000px) rotateX(0) rotateY(0)',
    transition: 'transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    boxShadow: hovered
      ? '0 40px 80px rgba(0,0,0,0.5), 0 15px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)'
      : '0 2px 8px rgba(0,0,0,0.2)',
    overflow: 'visible',
    zIndex: hovered ? 10 : 1,
  }

  return (
    <div ref={cardRef} style={cardStyle} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Link to={item.to} className={`block ${isPoster ? 'aspect-[2/3]' : 'aspect-[16/9]'}`} style={{ borderRadius: '14px', overflow: 'hidden' }}>
        <div className="relative h-full w-full">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} loading="lazy"
              className="h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          {hovered && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              }}
            />
          )}
          {item.badge && (
            <div className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
              {item.badge}
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}
