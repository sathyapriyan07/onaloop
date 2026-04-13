import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Shield, LogIn, User, Repeat2 } from 'lucide-react'
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

export default function FloatingBar() {
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
    <div className="fixed top-3 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <header
        className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(15,15,15,0.92)' : 'rgba(15,15,15,0.75)',
          backdropFilter: 'blur(20px)',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.2)',
          maxWidth: 680,
          width: '100%',
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 px-2 shrink-0">
          <Repeat2 size={15} className="text-accent" strokeWidth={2.5} />
          <span className="text-xs font-black tracking-tight uppercase hidden sm:inline">
            On<span className="text-accent">The</span>Loop
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center flex-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `relative px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${isActive ? 'text-white bg-white/10' : 'text-white/50 hover:text-white'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button onClick={() => navigate('/search')}
            className="relative flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-colors">
            <Search size={14} />
            {newCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-3 w-3 items-center justify-center rounded-full text-[7px] font-black text-white" style={{ background: 'var(--accent)' }}>
                {newCount > 9 ? '9+' : newCount}
              </span>
            )}
          </button>

          {isAdmin && (
            <NavLink to="/admin" className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-colors">
              <Shield size={14} />
            </NavLink>
          )}

          {user ? (
            <Link to="/profile" className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/8 transition-colors">
              <User size={14} />
            </Link>
          ) : (
            <>
              <NavLink to="/login" className="px-2.5 py-1 text-xs font-semibold text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/8">
                Log in
              </NavLink>
              <NavLink to="/signup" className="px-2.5 py-1 text-xs font-bold text-white rounded-full transition-opacity hover:opacity-90" style={{ background: 'var(--accent)' }}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </header>
    </div>
  )
}
