import PosterCard from './PosterCard'

type Item = {
  id: string
  title: string
  posterUrl?: string | null
  logoUrl?: string | null
  type: 'movie' | 'series'
}

export default function PosterRail({ title, items }: { title: string; items: Item[] }) {
  if (!items.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <PosterCard
            key={item.id}
            to={item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`}
            title={item.title}
            posterUrl={item.posterUrl}
            logoUrl={item.logoUrl}
          />
        ))}
      </div>
    </section>
  )
}

