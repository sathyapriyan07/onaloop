import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Repeat2, Bookmark, Eye } from 'lucide-react'
import { useSession } from '../../lib/useSession'
import { supabase } from '../../lib/supabase'
import { usePageMeta } from '../../lib/usePageMeta'

type ContentItem = { id: string; title: string; to: string; posterUrl: string | null }

function ContentRow({ items }: { items: ContentItem[] }) {
  if (!items.length) return null
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => (
        <Link key={item.id} to={item.to} className="shrink-0 w-24">
          <div className="aspect-[193/256] overflow-hidden rounded-xl" style={{ background: 'var(--surface2)' }}>
            {item.posterUrl
              ? <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center p-2 text-center text-[9px] text-[var(--label3)]">{item.title}</div>}
          </div>
          <div className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-tight text-[var(--label2)]">{item.title}</div>
        </Link>
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
      <div className="flex flex-col items-center gap-2 rounded-2xl py-8 text-center" style={{ background: 'var(--surface)' }}>
      <div className="text-sm text-[var(--label3)]">{text}</div>
      <Link to="/movies" className="mt-1 rounded-full px-4 py-1.5 text-xs font-black" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
        Explore
      </Link>
    </div>
  )
}

export default function ProfilePage() {
  usePageMeta({ title: 'Profile' })
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
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <Repeat2 size={44} className="text-accent" />
        <div>
          <div className="text-2xl font-bold text-[var(--label)]">Join OnTheLoop</div>
          <p className="mt-1 text-sm text-[var(--label2)] max-w-xs">Track your watchlist, mark watched, and more.</p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/login" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--label2)] hover:text-[var(--label)] transition-colors"
            style={{ background: 'var(--surface)' }}>
            <LogIn size={14} /> Log in
          </Link>
          <Link to="/signup" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:opacity-85 transition-opacity"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            Sign up free
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-[var(--label)]"
          style={{ background: 'var(--surface2)' }}>
          {user.email?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold text-[var(--label)]">{user.email}</div>
          <div className="flex gap-3 text-xs text-[var(--label2)] mt-0.5">
            <span>{watchlist.length} watchlist</span>
            <span>{watched.length} watched</span>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()}
          className="shrink-0 rounded-full px-4 py-2 text-xs font-medium text-[var(--label2)] hover:text-[var(--label)] transition-colors"
          style={{ background: 'var(--surface)' }}>
          Sign out
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="otl-section-title flex items-center gap-2 text-[var(--label)]">
          <Bookmark size={15} className="text-accent" /> Watchlist
          {watchlist.length > 0 && <span className="text-xs text-[var(--label3)] font-normal">{watchlist.length}</span>}
        </h2>
        {loading ? <div className="h-36 skeleton rounded-2xl" /> : watchlist.length
          ? <ContentRow items={watchlist} />
          : <EmptyState text="Nothing saved yet." />}
      </section>

      <section className="space-y-3">
        <h2 className="otl-section-title flex items-center gap-2 text-[var(--label)]">
          <Eye size={15} className="text-green-400" /> Watched
          {watched.length > 0 && <span className="text-xs text-[var(--label3)] font-normal">{watched.length}</span>}
        </h2>
        {loading ? <div className="h-36 skeleton rounded-2xl" /> : watched.length
          ? <ContentRow items={watched} />
          : <EmptyState text="Mark movies as watched to track history." />}
      </section>
    </div>
  )
}
