import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, User, Compass, Shield, Library } from 'lucide-react'
import clsx from 'clsx'
import { useAdminGuard } from '../../lib/useAdminGuard'

const userLinks = [
  { to: '/', icon: Home, end: true },
  { to: '/discover', icon: Compass },
  { to: '/collections', icon: Library },
  { to: '/search', icon: Search },
  { to: '/profile', icon: User },
]

export default function BottomNav() {
  const { isAdmin } = useAdminGuard()
  const navigate = useNavigate()

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mx-auto flex w-full max-w-screen-2xl">
        {userLinks.map(({ to, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => clsx(
              'flex flex-1 flex-col items-center justify-center py-3 gap-1 transition-colors',
              isActive ? 'text-white' : 'text-white/35 hover:text-white/60'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                {isActive && <span className="w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />}
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <button onClick={() => navigate('/admin')}
            className="flex flex-1 flex-col items-center justify-center py-3 text-white/35 hover:text-white/60 transition-colors">
            <Shield size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </nav>
  )
}
