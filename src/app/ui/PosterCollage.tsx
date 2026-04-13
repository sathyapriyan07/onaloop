type Props = { posters: (string | null)[] }

export default function PosterCollage({ posters }: Props) {
  const urls = posters.filter(Boolean) as string[]
  if (!urls.length) return null

  const cols = 6
  const perCol = 4
  const columns = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: perCol }, (_, r) => urls[(c * perCol + r) % urls.length])
  )

  return (
    <section className="relative overflow-hidden rounded-3xl bg-neutral-950 border border-white/8" style={{ minHeight: 200 }}>
      {/* Full-bleed staggered poster grid */}
      <div className="absolute inset-0 flex gap-1.5 p-1.5 overflow-hidden">
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="flex flex-1 flex-col gap-1.5"
            style={{ marginTop: ci % 2 === 1 ? '-20px' : '0px' }}
          >
            {col.map((url, ri) => (
              <img
                key={ri}
                src={url}
                alt=""
                loading="lazy"
                className="w-full aspect-[2/3] object-cover rounded-lg shrink-0"
              />
            ))}
          </div>
        ))}
      </div>
      {/* Subtle vignette so edges blend into page */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-neutral-950/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/30 via-transparent to-neutral-950/60" />
    </section>
  )
}
