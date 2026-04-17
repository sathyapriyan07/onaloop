import { Link } from 'react-router-dom'

type Props = {
  to: string
  title: string
  posterUrl?: string | null
}

export default function HomePosterCard({ to, title, posterUrl }: Props) {
  return (
    <Link
      to={to}
      className="group relative block aspect-[2/3] w-[32vw] max-w-[160px] shrink-0 overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={{ background: 'var(--surface2)' }}>
          <span className="px-2 text-center text-xs font-medium text-[var(--label2)]">{title}</span>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, var(--overlay-strong), var(--overlay-medium) 60%, transparent 100%)',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="line-clamp-2 text-xs font-semibold tracking-tight text-[var(--label)]">{title}</div>
      </div>
    </Link>
  )
}
