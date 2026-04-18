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
}

export default function ContentGrid({ title, items, aspect = 'poster' }: Props) {
  if (!items.length) return null

  const gridClass = aspect === 'poster'
    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="space-y-3">
      {title && <h2 className="text-[17px] font-bold tracking-tight text-[var(--label)]">{title}</h2>}
      <div className={`grid gap-2 ${gridClass}`}>
        {items.map((item) => (
          <Link key={item.id} to={item.to}
            className={`group relative overflow-hidden rounded-xl ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}
            style={{ background: 'var(--surface)' }}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            ) : null}
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
