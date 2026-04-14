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

export default function ContentGrid({ title, items, aspect = 'poster', showLogo = true }: Props) {
  if (!items.length) return null

  const gridClass = aspect === 'poster'
    ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="space-y-3">
      {title && <h2 className="text-[17px] font-bold tracking-tight">{title}</h2>}
      <div className={`grid gap-2 ${gridClass}`}>
        {items.map((item) => (
          <Link key={item.id} to={item.to}
            className={`group relative overflow-hidden rounded-xl bg-[#1c1c1e] ${aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]'}`}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-white/40">{item.title}</div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2">
              {showLogo && item.logoUrl ? (
                <img src={item.logoUrl} alt={item.title} className="max-h-6 max-w-[80%] object-contain object-left drop-shadow-md" />
              ) : (
                <div className="line-clamp-2 text-[10px] font-semibold leading-tight">{item.title}</div>
              )}
              {item.sub && <div className="mt-0.5 line-clamp-1 text-[9px] text-white/40">{item.sub}</div>}
            </div>
            {item.badge && (
              <div className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold backdrop-blur-sm">
                {item.badge}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
