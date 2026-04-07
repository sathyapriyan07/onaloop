import clsx from 'clsx'
import { Link } from 'react-router-dom'

type Props = {
  to: string
  title: string
  posterUrl?: string | null
  logoUrl?: string | null
  aspect?: 'poster' | 'backdrop'
}

export default function PosterCard({ to, title, posterUrl, logoUrl, aspect = 'poster' }: Props) {
  return (
    <Link
      to={to}
      className={clsx(
        'group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5',
        aspect === 'poster' ? 'aspect-[2/3] w-[44vw] max-w-[180px]' : 'aspect-[16/9] w-[78vw] max-w-[420px]',
      )}
    >
      {posterUrl ? (
        <img
          src={posterUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/5 to-white/0">
          <span className="px-3 text-center text-sm font-medium text-white/70">{title}</span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/0" />

      <div className="absolute bottom-0 left-0 right-0 p-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={title}
            loading="lazy"
            className="max-h-10 w-auto max-w-full object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)]"
          />
        ) : (
          <div className="line-clamp-2 text-sm font-semibold tracking-tight">{title}</div>
        )}
      </div>
    </Link>
  )
}

