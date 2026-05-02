import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Shield, User, Repeat2 } from 'lucide-react'
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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('series').select('id', { count: 'exact', head: true }).gte('created_at', since),
    ]).then(([m, s]) => setNewCount((m.count ?? 0) + (s.count ?? 0)))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useKeyboardShortcut('/', () => navigate('/search'))

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: scrolled ? 'rgba(11,12,15,0.95)' : 'rgba(11,12,15,0.85)',
        borderColor: 'var(--separator)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="mx-auto flex h-12 w-full max-w-screen-2xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            <Repeat2 size={14} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-black tracking-tight text-[var(--label)] hidden sm:inline">
            OnTheLoop
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  isActive ? 'text-[var(--on-accent)]' : 'text-[var(--label2)] hover:text-[var(--label)]'
                }`
              }
              style={({ isActive }: { isActive: boolean }) => isActive ? { background: 'var(--accent)' } : {}}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => navigate('/search')}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--label2)] hover:text-[var(--label)] hover:bg-white/5 transition-colors"
          >
            <Search size={15} />
            {newCount > 0 && (
              <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-black" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          {isAdmin && (
            <NavLink to="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--label2)] hover:text-[var(--label)] hover:bg-white/5 transition-colors"
            >
              <Shield size={15} />
            </NavLink>
          )}

          {user ? (
            <Link to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--label2)] hover:text-[var(--label)] hover:bg-white/5 transition-colors"
            >
              <User size={15} />
            </Link>
          ) : (
            <>
              <NavLink to="/login"
                className="px-3 py-1.5 text-xs font-semibold rounded-md text-[var(--label2)] hover:text-[var(--label)] hover:bg-white/5 transition-colors"
              >
                Log in
              </NavLink>
              <NavLink to="/signup" className="px-3 py-1.5 text-xs font-bold rounded-md transition-opacity hover:opacity-90" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>

      <nav className="flex md:hidden border-t" style={{ borderColor: 'var(--separator)' }}>
        {navLinks.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex-1 py-2 text-center text-[10px] font-semibold transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[var(--label3)]'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
