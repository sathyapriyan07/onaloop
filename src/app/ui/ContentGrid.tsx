import { Link } from 'react-router-dom'

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
    <section className="space-y-3">
      {title && <h2 className="otl-section-title text-[var(--label)]">{title}</h2>}
      <div className={`grid gap-2 ${gridClass}`}>
        {items.map((item) => (
          <Link key={item.id} to={item.to}
            className={`otl-card group transition-transform duration-300 hover:-translate-y-0.5 ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Title and logo removed as requested */}
            {item.badge && (
              <div
                className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-sm text-[var(--label)]"
                style={{ background: 'var(--overlay-strong)', color: 'var(--label)' }}
              >
                {item.badge}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
