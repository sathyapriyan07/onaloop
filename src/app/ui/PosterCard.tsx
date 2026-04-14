import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

type Props = {
  to: string
  title: string
  posterUrl?: string | null
  logoUrl?: string | null
  aspect?: 'poster' | 'backdrop'
  rating?: number | null
  year?: string | null
  genres?: string[]
  loopScore?: number | null
}

export default function PosterCard({ to, title, posterUrl, logoUrl, aspect = 'poster', rating, year }: Props) {
  return (
    <Link
      to={to}
      className={clsx(
        'group relative block overflow-hidden rounded-xl bg-[#1c1c1e] transition-transform duration-300 hover:scale-[1.04]',
        aspect === 'poster' ? 'aspect-[2/3]' : 'aspect-[16/9]',
      )}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs font-medium text-white/40">{title}</div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt={title} loading="lazy" className="max-h-8 w-auto max-w-full object-contain object-left drop-shadow-lg" />
        ) : (
          <div className="line-clamp-2 text-xs font-semibold leading-tight">{title}</div>
        )}
        {(rating || year) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/50">
            {rating ? <span className="flex items-center gap-0.5"><Star size={8} className="text-yellow-400" fill="currentColor" />{rating}</span> : null}
            {year ? <span>{year}</span> : null}
          </div>
        )}
      </div>
    </Link>
  )
}
