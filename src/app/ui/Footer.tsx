import { Link } from 'react-router-dom'
import { Repeat2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="px-4 py-10 pb-28" style={{ borderTop: '1px solid var(--separator)' }}>
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Repeat2 size={16} className="text-accent" strokeWidth={2.5} />
            <span className="text-sm font-bold">On<span className="text-accent">The</span>Loop</span>
          </div>
          <p className="text-[11px] text-[var(--label3)] max-w-[200px]">Discover. Track. Loop your favorites.</p>
        </div>

        <div className="flex gap-10 text-[11px]">
          <div className="space-y-2">
            <div className="font-semibold text-[var(--label3)] uppercase tracking-wider text-[9px]">Browse</div>
            <div className="space-y-1.5">
              {[['Movies', '/movies'], ['Series', '/series'], ['Genres', '/genres'], ['Platforms', '/platforms']].map(([label, to]) => (
                <Link key={to} to={to} className="block text-[var(--label2)] hover:text-[var(--label)] transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-semibold text-[var(--label3)] uppercase tracking-wider text-[9px]">Explore</div>
            <div className="space-y-1.5">
              <Link to="/search" className="block text-[var(--label2)] hover:text-[var(--label)] transition-colors">Search</Link>
              <Link to="/discover" className="block text-[var(--label2)] hover:text-[var(--label)] transition-colors">Discover</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl mt-6 pt-4 flex items-center justify-between text-[10px] text-[var(--label3)]"
        style={{ borderTop: '1px solid var(--separator)' }}>
        <span>© {new Date().getFullYear()} OnTheLoop</span>
        <span>Powered by TMDb</span>
      </div>
    </footer>
  )
}
