import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { LayoutGrid, List } from 'lucide-react'
import PosterCard from '../ui/PosterCard'
import { supabase } from '../../lib/supabase'

type Series = {
  id: string
  title: string
  first_air_date: string | null
  selected_poster_url: string | null
  selected_logo_url: string | null
  overview: string | null
}

export default function SeriesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('series')
        .select('id,title,first_air_date,selected_poster_url,selected_logo_url,overview')
        .order('first_air_date', { ascending: false })
        .limit(120)

      if (!isMounted) return
      setSeries((data ?? []) as Series[])
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  const grid = useMemo(() => {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {series.map((s) => (
          <PosterCard
            key={s.id}
            to={`/series/${s.id}`}
            title={s.title}
            posterUrl={s.selected_poster_url}
            logoUrl={s.selected_logo_url}
          />
        ))}
      </div>
    )
  }, [series])

  const list = useMemo(() => {
    return (
      <div className="space-y-3">
        {series.map((s) => (
          <Link
            key={s.id}
            to={`/series/${s.id}`}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
          >
            <div className="aspect-[2/3] w-16 overflow-hidden rounded-xl bg-white/5">
              {s.selected_poster_url ? (
                <img src={s.selected_poster_url} alt={s.title} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{s.title}</div>
              <div className="mt-1 text-xs text-white/60">{s.first_air_date ? s.first_air_date.slice(0, 4) : ''}</div>
              {s.overview ? <p className="mt-2 line-clamp-2 text-xs text-white/60">{s.overview}</p> : null}
            </div>
          </Link>
        ))}
      </div>
    )
  }, [series])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Series</h1>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setView('grid')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              view === 'grid' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white',
            )}
          >
            <LayoutGrid size={14} />
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={clsx(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              view === 'list' ? 'bg-white text-neutral-950' : 'text-white/70 hover:text-white',
            )}
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>

      {view === 'grid' ? grid : list}
    </div>
  )
}

