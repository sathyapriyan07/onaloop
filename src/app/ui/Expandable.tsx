import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
        className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
      >
        {open ? collapseLabel : label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}
