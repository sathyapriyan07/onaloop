import type { ReactNode } from 'react'

type Props = {
  title: string
  backdropUrl?: string | null
  posterUrl?: string | null
  logoUrl?: string | null
  meta?: ReactNode
  actions?: ReactNode
  right?: ReactNode
}

export default function DetailHero({ title, backdropUrl, posterUrl, logoUrl, meta, actions, right }: Props) {
  return (
    <section className="relative">
      <div className="relative h-[220px] w-full overflow-hidden md:h-[320px]" style={{ background: 'var(--surface)' }}>
        {backdropUrl ? (
          <img src={backdropUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom right, var(--surface2), var(--surface))' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.40) 35%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
      </div>

      <div className="relative -mt-16 md:-mt-20">
        <div className="mx-auto w-full max-w-screen-xl px-4 pb-6">
          <div className="grid min-w-0 gap-4 md:gap-6 lg:grid-cols-[180px_1fr_320px] lg:items-start">
            <div className="flex items-start gap-4 lg:block">
              {posterUrl ? (
                <div className="shrink-0 w-24 overflow-hidden rounded-[18px] lg:w-full" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.18)', aspectRatio: '2/3' }}>
                  <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              ) : null}

              <div className="flex-1 min-w-0 lg:hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={title} className="max-h-12 w-auto max-w-[80%] object-contain object-left" style={{ filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.5))' }} />
                ) : (
                  <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[var(--label)]">{title}</h1>
                )}
                {meta ? <div className="mt-2">{meta}</div> : null}
                {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
              </div>
            </div>

            <div className="hidden min-w-0 lg:block">
              {logoUrl ? (
                <img src={logoUrl} alt={title} className="max-h-12 w-auto max-w-[70%] object-contain object-left" style={{ filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.5))' }} />
              ) : (
                <h1 className="text-[34px] leading-tight font-bold tracking-tight text-[var(--label)]">{title}</h1>
              )}
              {meta ? <div className="mt-2">{meta}</div> : null}
              {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
            </div>

            {right ? <div className="min-w-0 lg:justify-self-end">{right}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
