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
    <section className="relative overflow-hidden rounded-3xl border" style={{ background: 'var(--surface)', borderColor: 'var(--separator)', minHeight: 200 }}>
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
                className="w-full aspect-[193/256] object-cover rounded-lg shrink-0"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg), transparent 60%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, var(--bg), transparent 60%)' }} />
    </section>
  )
}
