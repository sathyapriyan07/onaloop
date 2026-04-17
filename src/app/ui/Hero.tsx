import { pickImageUrl } from '../../lib/image'

type Props = {
  title: string
  backdropUrl?: string | null
  backdropImages?: unknown
  logoUrl?: string | null
  titleLogos?: unknown
}

export default function Hero({ title, backdropUrl, backdropImages, logoUrl, titleLogos }: Props) {
  const bg = pickImageUrl(backdropUrl, backdropImages, null)
  const logo = pickImageUrl(logoUrl, titleLogos, null)

  return (
    <section className="relative overflow-hidden rounded-3xl border" style={{ 
      background: 'var(--surface)',
      borderColor: 'var(--separator)'
    }}>
      <div className="relative aspect-[16/9] w-full">
        {bg ? (
          <img src={bg} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom right, var(--surface2), var(--surface))' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg), transparent 40%, transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 p-4">
          {logo ? (
            <img
              src={logo}
              alt={title}
              className="max-h-14 w-auto max-w-[70%] object-contain object-left"
              style={{ filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.5))' }}
            />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight text-[var(--label)]">{title}</h1>
          )}
        </div>
      </div>
    </section>
  )
}
