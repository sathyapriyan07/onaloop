type Props = { count?: number; cols?: string }

export default function PosterGridSkeleton({ count = 12, cols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' }: Props) {
  return (
    <div className={`grid gap-3 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[193/256] rounded-[18px] skeleton" />
      ))}
    </div>
  )
}
