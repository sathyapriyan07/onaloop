type Props = {
  title: string
  imageUrl?: string | null
  aspectClassName?: string
}

export default function CurvedHero({ title, imageUrl, aspectClassName = 'aspect-[16/9] md:aspect-[21/8]' }: Props) {
  return (
    <section className={`relative w-full overflow-hidden ${aspectClassName}`} style={{ background: 'var(--surface)' }}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom right, var(--surface2), var(--surface))' }} />
      )}

      <svg
        className="absolute -bottom-px left-0 h-20 w-full"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,12 C25,0 75,0 100,12 L100,20 L0,20 Z" fill="var(--bg)" />
      </svg>
    </section>
  )
}

