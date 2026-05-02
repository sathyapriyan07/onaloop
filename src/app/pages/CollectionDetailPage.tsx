import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { usePageMeta } from '../../lib/usePageMeta'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null }
type Item = { id: string; title: string; to: string; posterUrl: string | null; rating: number | null; year: string | null; type: 'movie' | 'series' }

export default function CollectionDetailPage() {
  const { id } = useParams()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [items, setItems] = useState<Item[]>([])

  usePageMeta({ title: collection?.name ? `Collection: ${collection.name}` : 'Collection' })

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('collections').select('id,name,description,cover_image_url').eq('id', id).maybeSingle(),
      supabase.from('collection_items')
        .select('sort_order,movie:movies(id,title,selected_poster_url,tmdb_rating,release_date),series:series(id,title,selected_poster_url,tmdb_rating,first_air_date)')
        .eq('collection_id', id).order('sort_order'),
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

  if (!collection) return <div className="text-[var(--label3)] text-sm px-4 pt-8">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="otl-card">
        <div className="aspect-[16/9] w-full md:aspect-[21/6]">
          {collection.cover_image_url
            ? <img src={collection.cover_image_url} alt={collection.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full" style={{ background: 'var(--surface2)' }} />}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="otl-title text-[var(--label)]">{collection.name}</h1>
          {collection.description && <p className="mt-1 text-sm text-[var(--label2)] max-w-lg">{collection.description}</p>}
          <div className="mt-1 text-xs text-[var(--label3)]">{items.length} title{items.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-white/30">No items in this collection yet.</div>
      ) : (
        <div className="w-[965px] max-w-full mx-auto grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <Link key={item.id} to={item.to}
              className="otl-card aspect-[193/256]">
              {item.posterUrl
                ? <img src={item.posterUrl} alt={item.title}
                    className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-[var(--label3)]">{item.title}</div>}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              {item.rating && (
                <div className="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  ★ {item.rating}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2">
                <div className="line-clamp-2 text-[10px] font-semibold leading-tight">{item.title}</div>
                {item.year && <div className="mt-0.5 text-[9px] text-[var(--label3)]">{item.year}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
