import { Link } from 'react-router-dom'
import { Repeat2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-neutral-950 px-4 py-8 pb-28">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Repeat2 size={18} className="text-accent" strokeWidth={2.5} />
              <span className="text-base font-bold tracking-tight">On<span className="text-accent">The</span>Loop</span>
            </div>
            <p className="text-xs text-white/40 max-w-[220px]">
              Discover. Track. Loop your favorites.
            </p>
          </div>

          <div className="flex gap-10 text-xs">
            <div className="space-y-2">
              <div className="font-semibold text-white/40 uppercase tracking-wider text-[10px]">Browse</div>
              <div className="space-y-1.5">
                {[['Movies', '/movies'], ['Series', '/series'], ['Genres', '/genres'], ['Platforms', '/platforms'], ['Studios', '/studios']].map(([label, to]) => (
                  <Link key={to} to={to} className="block text-white/50 hover:text-white transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold text-white/40 uppercase tracking-wider text-[10px]">Discover</div>
              <div className="space-y-1.5">
                <Link to="/search" className="block text-white/50 hover:text-white transition-colors">Search</Link>
                <Link to="/genres" className="block text-white/50 hover:text-white transition-colors">Genres</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-white/25">
          <span>© {new Date().getFullYear()} OnTheLoop. All rights reserved.</span>
          <span>Powered by TMDb</span>
        </div>
      </div>
    </footer>
  )
}
