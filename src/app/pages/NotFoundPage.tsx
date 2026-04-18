import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="text-5xl font-black tracking-tight text-[var(--label)]">404</div>
      <div className="text-sm text-[var(--label2)]">That page doesn’t exist.</div>
      <div className="flex gap-2">
        <Link
          to="/"
          className="rounded-full px-5 py-2 text-sm font-semibold text-white hover:opacity-85 transition-opacity"
          style={{ background: 'var(--accent)' }}
        >
          Go home
        </Link>
        <Link
          to="/search"
          className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
          style={{ background: 'var(--surface)' }}
        >
          Search
        </Link>
      </div>
    </div>
  )
}
