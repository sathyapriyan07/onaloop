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

export default function DetailHero({ title, backdropUrl, posterUrl, logoUrl, meta, right }: Props) {
  return (
    <section className="relative pt-6">
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <div className="relative overflow-hidden rounded-[14px]" style={{ background: 'var(--surface)' }}>
          <div className="relative h-[200px] w-full md:h-[280px] lg:h-[340px]">
            {backdropUrl ? (
              <img src={backdropUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: 'linear-gradient(to bottom right, var(--surface2), var(--surface))' }} />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg) 0%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
          </div>
        </div>
      </div>

      <div className="relative mt-5 md:mt-7">
        <div className="mx-auto w-full max-w-screen-xl px-4 pb-6">
          <div className="grid min-w-0 gap-4 md:gap-6 lg:grid-cols-[150px_1fr_320px] lg:items-start">
            <div className="hidden lg:block">
              {posterUrl ? (
                <div className="shrink-0 overflow-hidden rounded-[18px]" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.3)', aspectRatio: '2/3' }}>
                  <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-4 lg:hidden">
              {posterUrl ? (
                <div className="shrink-0 w-20 overflow-hidden rounded-[14px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)', aspectRatio: '2/3' }}>
                  <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              ) : null}

              <div className="flex-1 min-w-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={title} className="max-h-10 w-auto max-w-[80%] object-contain object-left" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))' }} />
                ) : (
                  <h1 className="text-[24px] leading-tight font-bold tracking-tight text-[var(--label)]">{title}</h1>
                )}
                {meta ? <div className="mt-1.5">{meta}</div> : null}
              </div>
            </div>

            <div className="hidden min-w-0 lg:block">
              {logoUrl ? (
                <img src={logoUrl} alt={title} className="max-h-10 w-auto max-w-[70%] object-contain object-left" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))' }} />
              ) : (
                <h1 className="text-[28px] leading-tight font-bold tracking-tight text-[var(--label)]">{title}</h1>
              )}
              {meta ? <div className="mt-1.5">{meta}</div> : null}
            </div>

            {right ? <div className="min-w-0 lg:justify-self-end">{right}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
