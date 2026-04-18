export default function PageLoader() {
  return (
    <div className="space-y-4 pt-4">
      <div className="h-8 w-48 rounded-xl skeleton" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
        ))}
      </div>
    </div>
  )
}
