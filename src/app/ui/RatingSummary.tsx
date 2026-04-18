import { Star } from 'lucide-react'

type Props = {
  ratings: Array<number | null | undefined>
}

function toStarCount(value: number | null | undefined) {
  if (!value) return null
  if (value < 1 || value > 5) return null
  return value
}

export default function RatingSummary({ ratings }: Props) {
  const counts = [0, 0, 0, 0, 0] // 1..5
  for (const r of ratings) {
    const v = toStarCount(r)
    if (!v) continue
    counts[v - 1] += 1
  }

  const total = counts.reduce((s, n) => s + n, 0)
  if (!total) return null

  const sum = counts.reduce((s, n, i) => s + n * (i + 1), 0)
  const avg = (sum / total).toFixed(1)
  const max = Math.max(1, ...counts)

  return (
    <div className="grid gap-4 rounded-2xl p-4 sm:grid-cols-[180px_1fr]" style={{ background: 'var(--surface)' }}>
      <div className="flex items-center gap-3">
        <div className="text-4xl font-black tracking-tight text-[var(--label)]">{avg}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < Math.round(Number(avg)) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--label3)]'} />
            ))}
          </div>
          <div className="text-xs text-[var(--label3)]">{total} rating{total === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const c = counts[stars - 1]
          const w = (c / max) * 100
          return (
            <div key={stars} className="flex items-center gap-2">
              <div className="w-12 text-[10px] font-semibold text-[var(--label3)]">{stars}★</div>
              <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface2)' }}>
                <div className="h-full rounded-full" style={{ width: `${w}%`, background: 'var(--accent)' }} />
              </div>
              <div className="w-8 text-right text-[10px] font-semibold text-[var(--label3)]">{c}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

