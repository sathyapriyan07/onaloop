import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, User, Compass, Shield, Library } from 'lucide-react'
import clsx from 'clsx'
import { useAdminGuard } from '../../lib/useAdminGuard'

const userLinks = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/collections', icon: Library, label: 'Collections' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const base = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors relative'

export default function BottomNav() {
  const { isAdmin } = useAdminGuard()
  const navigate = useNavigate()

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/5 bg-neutral-950/98 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex w-full max-w-screen-2xl">
        {userLinks.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => clsx(base, isActive ? 'text-accent' : 'text-white/40 hover:text-white/70')}
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <button onClick={() => navigate('/admin')} className={clsx(base, 'text-white/40 hover:text-white/70')}>
            <Shield size={18} strokeWidth={1.8} />
            Admin
          </button>
        )}
      </div>
    </nav>
  )
}
