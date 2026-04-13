import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('collections').select('id,name,description,cover_image_url').order('sort_order').then(({ data }) => {
      setCollections((data ?? []) as Collection[])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <div className="h-7 w-40 skeleton rounded-lg" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[16/9] skeleton rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Collections</h1>
      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="text-4xl">🎞️</div>
          <div className="text-sm text-white/50">No collections yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {collections.map((c) => (
            <Link
              key={c.id}
              to={`/collection/${c.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 aspect-[16/9] hover:border-white/25 transition-colors"
            >
              {c.cover_image_url
                ? <img src={c.cover_image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                : <div className="h-full w-full bg-gradient-to-br from-accent/20 via-white/5 to-transparent" />
              }
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-sm font-bold">{c.name}</div>
                {c.description && <div className="mt-0.5 line-clamp-1 text-xs text-white/50">{c.description}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
