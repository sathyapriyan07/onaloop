import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

type Item = {
  id: string
  title: string
  to: string
  posterUrl: string | null
}

type Props = {
  title: string
  items: Item[]
  viewAllTo?: string
}

export default function HomeRail({ title, items, viewAllTo }: Props) {
  if (!items.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-4">
        <h2 className="text-[26px] font-black tracking-tight text-[var(--label)]">{title}</h2>
        {viewAllTo ? (
          <Link to={viewAllTo} className="flex items-center gap-1 text-[13px] font-semibold text-accent hover:opacity-80 transition-opacity pb-1">
            See All <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 px-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="group relative shrink-0 w-[44vw] max-w-[190px] sm:w-[34vw] sm:max-w-[200px] aspect-[2/3] overflow-hidden rounded-[26px]"
              style={{ background: 'var(--surface)' }}
            >
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
