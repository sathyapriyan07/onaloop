type Props = { count?: number; aspect?: 'poster' | 'backdrop' }

export default function SkeletonRail({ count = 6, aspect = 'poster' }: Props) {
  const cardClass = aspect === 'poster'
    ? 'aspect-[2/3] w-[32vw] max-w-[150px]'
    : 'aspect-[16/9] w-[60vw] max-w-[280px]'

  return (
    <section className="space-y-3">
      <div className="h-5 w-32 skeleton rounded-lg" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`shrink-0 rounded-2xl skeleton ${cardClass}`} />
        ))}
      </div>
    </section>
  )
}
