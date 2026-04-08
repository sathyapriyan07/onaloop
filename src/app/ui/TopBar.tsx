import { Link, NavLink } from 'react-router-dom'
import { Search, Shield, LogIn, UserPlus, LogOut, Sun, Moon } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'
import { useAdminGuard } from '../../lib/useAdminGuard'
import { useTheme } from '../../lib/useTheme'

export default function TopBar() {
  const { user } = useSession()
  const { isAdmin } = useAdminGuard()
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 border-b theme-border theme-topbar backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">OnTheLoop</Link>
        <div className="flex items-center gap-1.5">
          <NavLink to="/search" className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10">
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </NavLink>
          <button
            onClick={toggle}
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white/80 hover:bg-white/5"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

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
