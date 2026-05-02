type Props = { count?: number; aspect?: 'poster' | 'backdrop' }

export default function SkeletonRail({ count = 6, aspect = 'poster' }: Props) {
  const cardClass = aspect === 'poster'
    ? 'aspect-[193/256] w-[34vw] max-w-[170px]'
    : 'aspect-[16/9] w-[64vw] max-w-[300px]'

  return (
    <section className="space-y-3.5">
      <div className="h-4 w-28 skeleton rounded-lg" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`shrink-0 rounded-[14px] skeleton ${cardClass}`} />
        ))}
      </div>
    </section>
  )
}
