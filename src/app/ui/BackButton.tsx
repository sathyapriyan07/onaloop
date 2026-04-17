import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed top-4 left-4 z-50 flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-[var(--label)] transition-colors"
      style={{
        background: 'var(--overlay-medium)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--separator)',
      }}
    >
      <ChevronLeft size={16} strokeWidth={2.5} />
      <span className="hidden sm:inline text-[13px]">Back</span>
    </button>
  )
}
