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
    <section className="space-y-3.5">
      <div className="flex items-end justify-between gap-3 px-4">
        <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--label)]">{title}</h2>
        {viewAllTo ? (
          <Link to={viewAllTo} className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:opacity-80 transition-opacity pb-0.5">
            See All <ArrowRight size={13} />
          </Link>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-4 px-4">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="otl-card shrink-0 w-[calc((100vw-2rem-2rem)/3)] sm:w-[34vw] sm:max-w-[210px] aspect-[2/3] rounded-[14px] overflow-hidden"
            >
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
