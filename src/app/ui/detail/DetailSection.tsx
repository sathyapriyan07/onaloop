import type { ReactNode } from 'react'

export default function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3.5">
      <h2 className="text-[15px] font-extrabold tracking-tight text-[var(--label)]">{title}</h2>
      {children}
    </div>
  )
}

