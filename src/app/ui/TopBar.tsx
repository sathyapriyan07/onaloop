import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Shield, LogIn, User, Repeat2 } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'
import { useAdminGuard } from '../../lib/useAdminGuard'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'
import ThemeToggle from './ThemeToggle'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/movies', label: 'Movies' },
  { to: '/series', label: 'Series' },
  { to: '/discover', label: 'Discover' },
  { to: '/collections', label: 'Collections' },
]

export default function TopBar() {
  const { user } = useSession()
  const { isAdmin } = useAdminGuard()
  const navigate = useNavigate()
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('series').select('id', { count: 'exact', head: true }).gte('created_at', since),
    ]).then(([m, s]) => setNewCount((m.count ?? 0) + (s.count ?? 0)))
  }, [])

  useKeyboardShortcut('/', () => navigate('/search'))

  return (
    <header className="sticky top-0 z-40" style={{ background: 'var(--surface)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--separator)' }}>
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 h-14 gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Repeat2 size={18} className="text-accent" strokeWidth={2.5} />
          <span className="text-sm font-bold tracking-tight uppercase">
            On<span className="text-accent">The</span>Loop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative px-4 h-14 flex items-center text-sm font-medium transition-colors ${
                  isActive ? 'text-[var(--label)]' : 'text-[var(--label2)] hover:text-[var(--label)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/search')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface3)] transition-colors"
            aria-label="Search"
          >
            <Search size={17} />
            {newCount > 0 && (
              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ background: 'var(--accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          {isAdmin && (
            <NavLink to="/admin" className="flex items-center gap-1.5 rounded-lg px-3 h-9 text-xs font-medium text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface3)] transition-colors">
              <Shield size={14} />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          )}

          {user ? (
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface3)] transition-colors">
              <User size={17} />
            </Link>
          ) : (
            <>
              <NavLink to="/login" className="flex items-center h-9 px-3 text-xs font-medium text-[var(--label2)] hover:text-[var(--label)] transition-colors">
                <LogIn size={14} className="mr-1.5" />
                <span className="hidden sm:inline">Log in</span>
              </NavLink>
              <NavLink to="/signup" className="flex items-center h-8 px-4 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ background: 'var(--accent)' }}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
