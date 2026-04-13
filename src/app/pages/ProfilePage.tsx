import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Repeat2, Bookmark, Eye } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'

type ContentItem = { id: string; title: string; to: string; posterUrl: string | null }

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
      <div className="text-3xl">{icon}</div>
      <div className="text-sm text-white/50">{text}</div>
      <Link to="/movies" className="mt-1 rounded-full px-4 py-1.5 text-xs font-semibold text-neutral-950" style={{ background: 'var(--accent)' }}>
        Explore Movies
      </Link>
    </div>
  )
}

function ContentRow({ items }: { items: ContentItem[] }) {
  if (!items.length) return null
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <Link key={item.id} to={item.to} className="group shrink-0 w-28">
          <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {item.posterUrl
              ? <img src={item.posterUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
              : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-white/40">{item.title}</div>
            }
          </div>
          <div className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight">{item.title}</div>
        </Link>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useSession()
  const [watchlist, setWatchlist] = useState<ContentItem[]>([])
  const [watched, setWatched] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      supabase.from('watchlist').select('movie:movies(id,title,selected_poster_url),series:series(id,title,selected_poster_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('watched').select('movie:movies(id,title,selected_poster_url),series:series(id,title,selected_poster_url)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([wl, wd]) => {
      function mapRows(rows: any[]): ContentItem[] {
        return rows.map((r) => {
          const movie = Array.isArray(r.movie) ? r.movie[0] : r.movie
          const series = Array.isArray(r.series) ? r.series[0] : r.series
          if (movie) return { id: movie.id, title: movie.title, to: `/movie/${movie.id}`, posterUrl: movie.selected_poster_url }
          if (series) return { id: series.id, title: series.title, to: `/series/${series.id}`, posterUrl: series.selected_poster_url }
          return null
        }).filter(Boolean) as ContentItem[]
      }
      if (!wl.error) setWatchlist(mapRows(wl.data ?? []))
      if (!wd.error) setWatched(mapRows(wd.data ?? []))
      setLoading(false)
    })
  }, [user])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Repeat2 size={40} className="text-accent" />
        <div className="text-xl font-bold">Join OnTheLoop</div>
        <p className="text-sm text-white/50 max-w-xs">Sign in to track your watchlist, liked movies, and more.</p>
        <div className="flex gap-3">
          <Link to="/login" className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">
            <LogIn size={14} /> Log in
          </Link>
          <Link to="/signup" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:opacity-90 transition-opacity" style={{ background: 'var(--accent)' }}>
            Sign up free
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black text-neutral-950" style={{ background: 'var(--accent)' }}>
          {user.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-bold">{user.email}</div>
          <div className="flex gap-3 text-xs text-white/40 mt-0.5">
            <span>{watchlist.length} in watchlist</span>
            <span>{watched.length} watched</span>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="ml-auto shrink-0 rounded-full border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 transition-colors">
          Sign out
        </button>
      </div>

      {/* Watchlist */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
          <Bookmark size={15} className="text-accent" /> My Watchlist
          {watchlist.length > 0 && <span className="text-xs text-white/40 font-normal">{watchlist.length}</span>}
        </h2>
        {loading ? <div className="h-40 skeleton rounded-2xl" /> : watchlist.length
          ? <ContentRow items={watchlist} />
          : <EmptyState icon="📋" text="Nothing here yet. Start exploring!" />
        }
      </section>

      {/* Watched */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight">
          <Eye size={15} className="text-green-400" /> Watched
          {watched.length > 0 && <span className="text-xs text-white/40 font-normal">{watched.length}</span>}
        </h2>
        {loading ? <div className="h-40 skeleton rounded-2xl" /> : watched.length
          ? <ContentRow items={watched} />
          : <EmptyState icon="👁️" text="Mark movies as watched to track your history." />
        }
      </section>
    </div>
  )
}
