type Props = { count?: number; cols?: string }

export default function PosterGridSkeleton({ count = 12, cols = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' }: Props) {
  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
      ))}
    </div>
  )
}
