import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

type Genre = {
  id: string
  name: string
  display_image_url: string | null
}

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data } = await supabase
        .from('genres')
        .select('id,name,display_image_url')
        .order('name', { ascending: true })
      if (!isMounted) return
      setGenres((data ?? []) as Genre[])
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Genres</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {genres.map((g) => (
          <Link
            key={g.id}
            to={`/genre/${g.id}`}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <div className="aspect-[16/10] w-full">
              {g.display_image_url ? (
                <img src={g.display_image_url} alt={g.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-white/10 via-white/5 to-white/0" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/0" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="text-sm font-semibold tracking-tight">{g.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

