import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'

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

export default function PosterCard({ to, title, posterUrl, logoUrl, aspect = 'poster', rating, year, genres, loopScore }: Props) {
  return (
    <Link
      to={to}
      className={clsx(
        'group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-transform duration-300 hover:scale-[1.03] hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        aspect === 'poster' ? 'aspect-[2/3] w-[46vw] max-w-[200px]' : 'aspect-[16/9] w-[78vw] max-w-[420px]',
      )}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white/5 to-white/0">
          <span className="px-3 text-center text-sm font-medium text-white/70">{title}</span>
        </div>
      )}

      {/* Base gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/0" />

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/90 via-black/50 to-black/20">
        {/* Top: loop score */}
        {loopScore != null && (
          <div className="flex justify-end">
            <span className="flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-bold text-accent">
              🔁 {loopScore}
            </span>
          </div>
        )}

        {/* Bottom: meta + actions */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            {logoUrl ? (
              <img src={logoUrl} alt={title} loading="lazy" className="max-h-8 w-auto max-w-full object-contain drop-shadow-md" />
            ) : (
              <div className="line-clamp-2 text-xs font-semibold leading-tight">{title}</div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/60">
              {rating ? <span className="flex items-center gap-0.5"><Star size={9} className="text-yellow-400" fill="currentColor" />{rating}</span> : null}
              {year ? <span>{year}</span> : null}
              {genres?.slice(0, 2).map((g) => <span key={g}>{g}</span>)}
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-white/20 bg-white/10 py-1.5 text-[10px] font-semibold backdrop-blur hover:bg-white/20 transition-colors"
            >
              <Plus size={11} /> Watchlist
            </button>
          </div>
        </div>
      </div>

      {/* Default bottom label (visible when not hovering) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 transition-opacity duration-300 group-hover:opacity-0">
        {logoUrl ? (
          <img src={logoUrl} alt={title} loading="lazy" className="max-h-10 w-auto max-w-full object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.65)]" />
        ) : (
          <div className="line-clamp-2 text-sm font-semibold tracking-tight">{title}</div>
        )}
      </div>
    </Link>
  )
}
