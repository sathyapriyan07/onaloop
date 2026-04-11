import { useState } from 'react'

type Props = {
  children: React.ReactNode
  preview: React.ReactNode
  label?: string
  collapseLabel?: string
}

export default function Expandable({ children, preview, label = 'Show more', collapseLabel = 'Show less' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      {open ? children : preview}
      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-white/50 hover:text-white transition-colors"
      >
        {open ? collapseLabel : label}
        <span className="material-icons-round" style={{ fontSize: 14 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
    </div>
  )
}
