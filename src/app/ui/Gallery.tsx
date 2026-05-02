import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type Props = {
  images: string[]
  title: string
}

export default function Gallery({ images, title }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (!images.length) return null

  const preview = images.slice(0, 4)
  const shown = expanded ? images : preview

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-[var(--label2)]">Gallery</h2>

      <div className="columns-2 sm:columns-3 gap-2">
        {shown.map((url, i) => (
          <div key={i} className="mb-2 break-inside-avoid overflow-hidden rounded-xl"
            style={{ background: 'var(--surface)' }}>
            <img
              src={url}
              alt={`${title} ${i + 1}`}
              className="w-full h-auto block"
            />
          </div>
        ))}
      </div>

      {images.length > 4 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
        >
          {expanded ? `Show less` : `Show all ${images.length} photos`}
          <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </section>
  )
}
