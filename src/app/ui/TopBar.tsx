import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Shield, LogIn, LogOut, User, Repeat2 } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'
import { useAdminGuard } from '../../lib/useAdminGuard'
import { useKeyboardShortcut } from '../../lib/useKeyboardShortcut'

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
    <header className="sticky top-0 z-40 border-b border-white/8 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Repeat2 size={20} className="text-accent" strokeWidth={2.5} />
          <span className="text-base font-bold tracking-tight">
            On<span className="text-accent">The</span>Loop
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/search')}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Search (press /)"
          >
            <Search size={16} />
            {newCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-neutral-950" style={{ background: 'var(--accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <NavLink
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 transition-colors"
            >
              <Shield size={14} />
              Admin
            </NavLink>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Profile"
              >
                <User size={16} />
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 transition-colors"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Log in</span>
              </NavLink>
              <NavLink
                to="/signup"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)' }}
              >
                <span>Sign up</span>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
