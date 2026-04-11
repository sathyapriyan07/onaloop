import { NavLink } from 'react-router-dom'
import { Clapperboard, Home, Tv, Compass, MonitorPlay, Clapperboard as StudioIcon } from 'lucide-react'
import clsx from 'clsx'

const linkBase = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors'

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-screen-2xl px-2">
        <NavLink to="/" end className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <Home size={17} />
          Home
        </NavLink>
        <NavLink to="/movies" className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <Clapperboard size={17} />
          Movies
        </NavLink>
        <NavLink to="/discover" className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <Compass size={17} />
          Discover
        </NavLink>
        <NavLink to="/series" className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <Tv size={17} />
          Series
        </NavLink>
        <NavLink to="/studios" className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <StudioIcon size={17} />
          Studios
        </NavLink>
        <NavLink to="/platforms" className={({ isActive }) => clsx(linkBase, isActive ? 'text-white' : 'text-white/60 hover:text-white/80')}>
          <MonitorPlay size={17} />
          Platforms
        </NavLink>
      </div>
    </nav>
  )
}
