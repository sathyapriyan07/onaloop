import { useEffect, useRef, useState } from 'react'
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

export default function FloatingBar() {
  const { user } = useSession()
  const { isAdmin } = useAdminGuard()
  const navigate = useNavigate()
  const [newCount, setNewCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    Promise.all([
      supabase.from('movies').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('series').select('id', { count: 'exact', head: true }).gte('created_at', since),
    ]).then(([m, s]) => setNewCount((m.count ?? 0) + (s.count ?? 0)))
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 20)
      setHidden(y > 80 ? y > lastY.current : false)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useKeyboardShortcut('/', () => navigate('/search'))

  return (
    <div className="fixed top-3 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <header
        className="pointer-events-auto flex items-center gap-0.5 px-1.5 py-1"
        style={{
          background: scrolled ? 'rgba(var(--bg-rgb, 0,0,0), 0.88)' : 'rgba(var(--bg-rgb, 0,0,0), 0.65)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 999,
          border: '1px solid var(--separator)',
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.4)' : 'none',
          maxWidth: 700,
          width: '100%',
          transform: hidden ? 'translateY(-72px)' : 'translateY(0)',
          opacity: hidden ? 0 : 1,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, background 0.3s ease, border-color 0.3s ease',
        }}
      >
        <Link to="/" className="flex items-center gap-1.5 px-2.5 py-1 shrink-0">
          <Repeat2 size={14} className="text-accent" strokeWidth={2.5} />
          <span className="text-[11px] font-bold tracking-tight hidden sm:inline">
            On<span className="text-accent">The</span>Loop
          </span>
        </Link>

        <nav className="hidden md:flex items-center flex-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-[11px] font-medium rounded-full transition-all duration-200 ${
                  isActive ? 'text-[var(--label)] bg-[var(--surface)]' : 'text-[var(--label2)] hover:text-[var(--label)]'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={() => navigate('/search')}
            className="relative flex h-7 w-7 items-center justify-center rounded-full text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface)] transition-colors">
            <Search size={13} />
            {newCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full text-[6px] font-black text-white" style={{ background: 'var(--accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          {isAdmin && (
            <NavLink to="/admin" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface)] transition-colors">
              <Shield size={13} />
            </NavLink>
          )}

          {user ? (
            <Link to="/profile" className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--label2)] hover:text-[var(--label)] hover:bg-[var(--surface)] transition-colors">
              <User size={13} />
            </Link>
          ) : (
            <>
              <NavLink to="/login" className="px-2.5 py-1 text-[11px] font-medium text-[var(--label2)] hover:text-[var(--label)] transition-colors rounded-full hover:bg-[var(--surface)]">
                Log in
              </NavLink>
              <NavLink to="/signup" className="px-3 py-1 text-[11px] font-semibold text-white rounded-full transition-opacity hover:opacity-85" style={{ background: 'var(--accent)' }}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </header>
    </div>
  )
}
