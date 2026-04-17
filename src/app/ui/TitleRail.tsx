import { Link } from 'react-router-dom'

type Item = {
  id: string
  title: string
  to: string
}

export default function TitleRail({ title, items }: { title: string; items: Item[] }) {
  if (!items.length) return null

  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight text-[var(--label)]">{title}</h2>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className="truncate rounded-lg px-2 py-1 text-sm text-[var(--label2)] hover:bg-[var(--surface)] hover:text-[var(--label)] transition-colors"
            title={item.title}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </section>
  )
}
