import type { ReactNode } from 'react'

export default function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--label2)]">{title}</h2>
      {children}
    </div>
  )
}

