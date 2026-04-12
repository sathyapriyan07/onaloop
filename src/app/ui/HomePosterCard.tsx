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
      className="group relative block aspect-[2/3] w-[32vw] max-w-[160px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5"
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/5 to-white/0">
          <span className="px-2 text-center text-xs font-medium text-white/70">{title}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/0" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="line-clamp-2 text-xs font-semibold tracking-tight">{title}</div>
      </div>
    </Link>
  )
}
