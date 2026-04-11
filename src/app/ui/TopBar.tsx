import { Link, NavLink } from 'react-router-dom'
import { Search, Shield, LogIn, UserPlus, LogOut } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'
import { useAdminGuard } from '../../lib/useAdminGuard'
import { useFont } from '../../lib/FontContext'

export default function TopBar() {
  const { user } = useSession()
  const { isAdmin } = useAdminGuard()
  const { font, setFont } = useFont()

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">OnTheLoop</Link>
        <div className="flex items-center gap-1.5">

          <div className="hidden sm:flex items-center rounded-full border border-white/10 bg-white/5 p-0.5 text-xs">
            <button onClick={() => setFont('bricolage')} className={['rounded-full px-2.5 py-1 font-semibold transition-colors', font === 'bricolage' ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>
              BG
            </button>
            <button onClick={() => setFont('be-vietnam')} className={['rounded-full px-2.5 py-1 font-semibold transition-colors', font === 'be-vietnam' ? 'bg-white text-neutral-950' : 'text-white/50 hover:text-white'].join(' ')}>
              BV
            </button>
          </div>

          <NavLink to="/search" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10">
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/admin" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
              <Shield size={16} />
              <span className="hidden sm:inline">Admin</span>
            </NavLink>
          )}

          {user ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          ) : (
            <>
              <NavLink to="/login" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
                <LogIn size={16} />
                <span className="hidden sm:inline">Log in</span>
              </NavLink>
              <NavLink to="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90">
                <UserPlus size={16} />
                <span className="hidden sm:inline">Sign up</span>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
