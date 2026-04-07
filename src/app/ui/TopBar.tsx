import { Link, NavLink } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          OnTheLoop
        </Link>
        <div className="flex items-center gap-3">
          <NavLink
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            <Search size={16} />
            Search
          </NavLink>
          <NavLink
            to="/admin"
            className="hidden rounded-full border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5 sm:inline-flex"
          >
            Admin
          </NavLink>
        </div>
      </div>
    </header>
  )
}

