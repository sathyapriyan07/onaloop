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
        'otl-card block',
        aspect === 'poster' ? 'aspect-[193/256]' : 'aspect-[16/9]',
      )}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="max-h-8 w-auto max-w-full object-contain object-left drop-shadow-lg" />
        ) : (
          <div className="line-clamp-2 text-xs font-semibold leading-tight text-[var(--label)]">{title}</div>
        )}
        {(rating || year) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px]">
            {rating ? (
              <span
                className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold backdrop-blur-sm"
                style={{ background: 'var(--overlay-strong)', color: 'var(--label)' }}
              >
                <Star size={8} className="text-yellow-400" fill="currentColor" />{rating}
              </span>
            ) : null}
            {year ? <span className="text-[var(--label2)]">{year}</span> : null}
          </div>
        )}
      </div>
    </Link>
  )
}
