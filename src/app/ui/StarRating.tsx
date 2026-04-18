import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          className="rounded"
        >
          <Star size={18} className={n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--label3)]'} />
        </button>
      ))}
    </div>
  )
}

