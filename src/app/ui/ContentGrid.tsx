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
    <section className="space-y-4">
      {title && <h2 className="otl-section-title text-[var(--label)]">{title}</h2>}
      <div className={`grid gap-5 ${gridClass}`}>
        {items.map((item) => (
          <Link key={item.id} to={item.to}
            className={`block rounded-[14px] overflow-hidden ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}>
            <div className="relative h-full w-full">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} loading="lazy"
                  className="h-full w-full object-cover" />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {item.badge && (
                <div className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-md"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                  {item.badge}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
