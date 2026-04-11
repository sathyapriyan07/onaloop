import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 px-4 py-8 pb-28">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="space-y-1.5">
            <div className="text-base font-semibold tracking-tight">OnTheLoop</div>
            <p className="text-xs text-white/40 max-w-[220px]">
              Admin-curated movie &amp; series discovery platform.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10 text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-white/60 uppercase tracking-wider text-[10px]">Browse</div>
              <div className="space-y-1.5">
                <Link to="/movies" className="block text-white/50 hover:text-white transition-colors">Movies</Link>
                <Link to="/series" className="block text-white/50 hover:text-white transition-colors">Series</Link>
                <Link to="/genres" className="block text-white/50 hover:text-white transition-colors">Genres</Link>
                <Link to="/platforms" className="block text-white/50 hover:text-white transition-colors">Platforms</Link>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-white/60 uppercase tracking-wider text-[10px]">Discover</div>
              <div className="space-y-1.5">
                <Link to="/discover" className="block text-white/50 hover:text-white transition-colors">Discover</Link>
                <Link to="/search" className="block text-white/50 hover:text-white transition-colors">Search</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-white/30">
          <span>© {new Date().getFullYear()} OnTheLoop. All rights reserved.</span>
          <span>Powered by TMDb</span>
        </div>
      </div>
    </footer>
  )
}
