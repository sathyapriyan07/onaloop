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
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {genres.map((g) => (
          <Link key={g.id} to={`/genre/${g.id}`}
            className="group relative overflow-hidden rounded-xl bg-neutral-900 aspect-[2/3]">
            {g.display_image_url
              ? <img src={g.display_image_url} alt={g.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
              : <div className="h-full w-full bg-neutral-800" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-2">
              <div className="text-xs font-bold leading-tight">{g.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

