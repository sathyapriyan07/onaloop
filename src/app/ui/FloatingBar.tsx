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
        className="pointer-events-auto flex items-center gap-0.5 px-1.5 py-1 rounded-full border"
        style={{
          background: scrolled ? 'rgba(20,22,26,0.92)' : 'rgba(20,22,26,0.78)',
          borderColor: 'var(--separator)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: scrolled ? '0 10px 40px rgba(0,0,0,0.35)' : '0 8px 30px rgba(0,0,0,0.22)',
          maxWidth: 780,
          width: '100%',
          transform: hidden ? 'translateY(-72px)' : 'translateY(0)',
          opacity: hidden ? 0 : 1,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, background 0.25s ease',
        }}
      >
        <Link to="/" className="flex items-center gap-2 px-2.5 py-1.5 shrink-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            <Repeat2 size={14} strokeWidth={2.5} />
          </span>
          <span className="text-[11px] font-black tracking-tight hidden sm:inline text-[var(--label)]">
            OnTheLoop
          </span>
        </Link>

        <nav className="hidden md:flex items-center flex-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                  isActive ? 'text-[var(--on-accent)]' : 'text-[var(--label2)] hover:text-[var(--label)]'
                }`
              }
              style={({ isActive }: { isActive: boolean }) => isActive ? { background: 'var(--accent)' } : {}}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={() => navigate('/search')}
            className="relative flex h-8 w-8 items-center justify-center rounded-full border text-[var(--label2)] hover:text-[var(--label)] transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--separator)' }}
          >
            <Search size={13} />
            {newCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-black" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          {isAdmin && (
            <NavLink to="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-full border text-[var(--label2)] hover:text-[var(--label)] transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--separator)' }}
            >
              <Shield size={13} />
            </NavLink>
          )}

          {user ? (
            <Link to="/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full border text-[var(--label2)] hover:text-[var(--label)] transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'var(--separator)' }}
            >
              <User size={13} />
            </Link>
          ) : (
            <>
              <NavLink to="/login"
                className="px-3 py-1.5 text-[11px] font-semibold rounded-full text-[var(--label2)] hover:text-[var(--label)] hover:bg-white/5 transition-colors"
              >
                Log in
              </NavLink>
              <NavLink to="/signup" className="px-3 py-1.5 text-[11px] font-black rounded-full transition-opacity hover:opacity-90" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </header>
    </div>
  )
}
