import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { usePageMeta } from '../../lib/usePageMeta'

type Collection = { id: string; name: string; description: string | null; cover_image_url: string | null }

export default function CollectionsPage() {
  usePageMeta({ title: 'Collections' })
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('collections').select('id,name,description,cover_image_url').order('sort_order')
      .then(({ data }) => { setCollections((data ?? []) as Collection[]); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <div className="h-7 w-40 skeleton rounded-lg" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[16/9] skeleton rounded-xl" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <h1 className="otl-title text-[var(--label)]">Collections</h1>
      {collections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="text-sm text-white/30">No collections yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {collections.map((c) => (
            <Link key={c.id} to={`/collection/${c.id}`}
              className="otl-card aspect-[16/9]">
              {c.cover_image_url
                ? <img src={c.cover_image_url} alt={c.name} loading="lazy"
                    className="h-full w-full object-cover" />
                : <div className="h-full w-full" style={{ background: 'var(--surface2)' }} />}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="text-xs font-bold">{c.name}</div>
                {c.description && <div className="mt-0.5 line-clamp-1 text-[10px] text-white/40">{c.description}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
