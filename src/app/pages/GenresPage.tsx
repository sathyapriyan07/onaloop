import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Genre = { id: string; name: string; display_image_url: string | null }

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    supabase.from('genres').select('id,name,display_image_url').order('name')
      .then(({ data }) => { if (isMounted) { setGenres((data ?? []) as Genre[]); setLoading(false) } })
    return () => { isMounted = false }
  }, [])

  return (
    <div className="space-y-5">
      <h1 className="otl-title text-[var(--label)]">Genres</h1>
      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/2] rounded-xl skeleton" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {genres.map((g) => (
            <Link key={g.id} to={`/genre/${g.id}`}
              className="otl-card group aspect-[3/2] transition-transform duration-300 hover:-translate-y-0.5">
              {g.display_image_url
                ? <img src={g.display_image_url} alt={g.name} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                : <div className="h-full w-full" style={{ background: 'var(--surface2)' }} />}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)' }} />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-sm font-bold text-[var(--label)]">{g.name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
