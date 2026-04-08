import { useMemo, type CSSProperties } from 'react'

type Item = { image: string; text: string; id: string }

type Props = {
  items: Item[]
  bend?: number
  textColor?: string
  borderRadius?: number
  scrollSpeed?: number
  scrollEase?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function CircularGallery({
  items,
  textColor = '#ffffff',
  borderRadius = 0.05,
  scrollSpeed = 2,
  scrollEase = 0.05,
}: Props) {
  const cleaned = useMemo(() => items.filter((it) => Boolean(it?.image)), [items])
  if (!cleaned.length) return null

  const durationSeconds = clamp(40 / Math.max(scrollSpeed, 0.1), 10, 80)
  const easing = `cubic-bezier(${clamp(scrollEase, 0, 1)}, 0, 1, 1)`

  const track = [...cleaned, ...cleaned]

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={
        {
          ['--cg-duration' as any]: `${durationSeconds}s`,
          ['--cg-ease' as any]: easing,
          ['--cg-text' as any]: textColor,
          ['--cg-radius' as any]: `${clamp(borderRadius, 0, 1) * 100}%`,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black/60 to-transparent" />

      <div className="cg-track flex h-full items-center gap-3 pr-3">
        {track.map((it, idx) => (
          <div
            key={`${it.id}-${idx}`}
            className="relative h-[200px] w-[320px] shrink-0 overflow-hidden bg-neutral-900"
            style={{ borderRadius: 'var(--cg-radius)' }}
            title={it.text}
          >
            <img src={it.image} alt={it.text} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
              <div className="line-clamp-1 text-sm font-semibold" style={{ color: 'var(--cg-text)' }}>
                {it.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .cg-track {
          width: max-content;
          animation: cg-scroll var(--cg-duration) linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .cg-track { animation: none; }
        }
        @keyframes cg-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
