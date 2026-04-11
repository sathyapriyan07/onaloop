import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PosterRail from '../ui/PosterRail'

type PH = { id: string; name: string; logo_url: string | null; display_image_url: string | null; description: string | null }

export default function ProductionHouseDetailPage() {
  const { id } = useParams()
  const [studio, setStudio] = useState<PH | null>(null)
  const [movies, setMovies] = useState<{ id: string; type: 'movie'; title: string; posterUrl: string | null; logoUrl: string | null }[]>([])

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const { data: ph } = await supabase.from('production_houses').select('id,name,logo_url,display_image_url,description').eq('id', id).maybeSingle()
      if (!isMounted) return
      setStudio(ph as PH | null)

      const { data: rows } = await supabase
        .from('movie_production_houses')
        .select('movie:movies(id,title,selected_poster_url,selected_logo_url)')
        .eq('production_house_id', id)
      if (!isMounted) return

      const seen = new Set<string>()
      const mv: typeof movies = []
      for (const row of (rows ?? []) as any[]) {
        const m = Array.isArray(row.movie) ? row.movie[0] : row.movie
        if (m && !seen.has(m.id)) {
          seen.add(m.id)
          mv.push({ id: m.id, type: 'movie', title: m.title, posterUrl: m.selected_poster_url, logoUrl: m.selected_logo_url })
        }
      }
      setMovies(mv)
    }
    run()
    return () => { isMounted = false }
  }, [id])

  if (!studio) return <div className="text-white/60">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {studio.display_image_url && (
          <img src={studio.display_image_url} alt={studio.name} className="h-36 w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
          {studio.logo_url
            ? <img src={studio.logo_url} alt={studio.name} className="h-8 w-auto max-w-[120px] object-contain" />
            : <h1 className="text-xl font-semibold tracking-tight">{studio.name}</h1>}
        </div>
      </div>

      {studio.description ? <p className="text-sm text-white/60">{studio.description}</p> : null}

      {movies.length ? (
        <PosterRail title="Movies" items={movies} />
      ) : (
        <div className="text-sm text-white/50">No movies assigned yet.</div>
      )}
    </div>
  )
}
