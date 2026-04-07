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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <div className="relative aspect-[16/9] w-full">
        {bg ? (
          <img src={bg} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/0" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          {logo ? (
            <img
              src={logo}
              alt={title}
              className="max-h-14 w-auto max-w-[70%] object-contain drop-shadow-[0_12px_26px_rgba(0,0,0,0.7)]"
            />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          )}
        </div>
      </div>
    </section>
  )
}

