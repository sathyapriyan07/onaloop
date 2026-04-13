import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null }
type Item = { id: string; title: string; to: string; posterUrl: string | null; rating: number | null; year: string | null; type: 'movie' | 'series' }

export default function CollectionDetailPage() {
  const { id } = useParams()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('collections').select('id,name,description,cover_image_url').eq('id', id).maybeSingle(),
      supabase.from('collection_items')
        .select('sort_order,movie:movies(id,title,selected_poster_url,tmdb_rating,release_date),series:series(id,title,selected_poster_url,tmdb_rating,first_air_date)')
        .eq('collection_id', id)
        .order('sort_order'),
    ]).then(([c, ci]) => {
      setCollection((c.data ?? null) as Collection | null)
      const mapped: Item[] = ((ci.data ?? []) as any[]).map((r) => {
        const movie = Array.isArray(r.movie) ? r.movie[0] : r.movie
        const series = Array.isArray(r.series) ? r.series[0] : r.series
        if (movie) return { id: movie.id, title: movie.title, to: `/movie/${movie.id}`, posterUrl: movie.selected_poster_url, rating: movie.tmdb_rating, year: movie.release_date?.slice(0, 4) ?? null, type: 'movie' as const }
        if (series) return { id: series.id, title: series.title, to: `/series/${series.id}`, posterUrl: series.selected_poster_url, rating: series.tmdb_rating, year: series.first_air_date?.slice(0, 4) ?? null, type: 'series' as const }
        return null
      }).filter(Boolean) as Item[]
      setItems(mapped)
    })
  }, [id])

  if (!collection) return <div className="text-white/40 text-sm">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10">
        <div className="aspect-[21/6] w-full">
          {collection.cover_image_url
            ? <img src={collection.cover_image_url} alt={collection.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-accent/30 via-white/5 to-transparent" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="text-2xl font-black tracking-tight">{collection.name}</h1>
          {collection.description && <p className="mt-1 text-sm text-white/60 max-w-lg">{collection.description}</p>}
          <div className="mt-1 text-xs text-white/40">{items.length} title{items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-sm text-white/40">No items in this collection yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 aspect-[2/3] hover:border-white/25 transition-colors"
            >
              {item.posterUrl
                ? <img src={item.posterUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                : <div className="flex h-full w-full items-center justify-center p-3 text-center text-xs text-white/40">{item.title}</div>
              }
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <div className="line-clamp-2 text-xs font-semibold">{item.title}</div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/50 mt-0.5">
                  {item.rating ? <span>★ {item.rating}</span> : null}
                  {item.year ? <span>{item.year}</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
