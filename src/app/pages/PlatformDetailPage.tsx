import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PosterRail from '../ui/PosterRail'

type Platform = { id: string; name: string; logo_url: string | null; display_image_url: string | null; category: string }
type ContentItem = { id: string; type: 'movie' | 'series'; title: string; posterUrl: string | null; logoUrl: string | null }

export default function PlatformDetailPage() {
  const { id } = useParams()
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [movies, setMovies] = useState<ContentItem[]>([])
  const [series, setSeries] = useState<ContentItem[]>([])

  useEffect(() => {
    if (!id) return
    let isMounted = true

    async function run() {
      const { data: p } = await supabase.from('platforms').select('id,name,logo_url,display_image_url,category').eq('id', id).maybeSingle()
      if (!isMounted) return
      setPlatform(p as Platform | null)

      const [{ data: mRows }, { data: sRows }] = await Promise.all([
        supabase.from('movie_streaming_links').select('movie:movies(id,title,selected_poster_url,selected_logo_url)').eq('platform_id', id),
        supabase.from('series_streaming_links').select('series:series(id,title,selected_poster_url,selected_logo_url)').eq('platform_id', id),
      ])
      if (!isMounted) return

      const seen = new Set<string>()
      const mv: ContentItem[] = []
      for (const row of (mRows ?? []) as any[]) {
        const m = Array.isArray(row.movie) ? row.movie[0] : row.movie
        if (m && !seen.has(m.id)) { seen.add(m.id); mv.push({ id: m.id, type: 'movie', title: m.title, posterUrl: m.selected_poster_url, logoUrl: m.selected_logo_url }) }
      }
      const sv: ContentItem[] = []
      const seenS = new Set<string>()
      for (const row of (sRows ?? []) as any[]) {
        const s = Array.isArray(row.series) ? row.series[0] : row.series
        if (s && !seenS.has(s.id)) { seenS.add(s.id); sv.push({ id: s.id, type: 'series', title: s.title, posterUrl: s.selected_poster_url, logoUrl: s.selected_logo_url }) }
      }
      setMovies(mv)
      setSeries(sv)
    }
    run()
    return () => { isMounted = false }
  }, [id])

  if (!platform) return <div className="text-white/60">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        {platform.display_image_url && (
          <img src={platform.display_image_url} alt={platform.name} className="h-36 w-full object-cover opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 p-4">
          {platform.logo_url
            ? <img src={platform.logo_url} alt={platform.name} className="h-8 w-auto max-w-[100px] object-contain" />
            : <h1 className="text-xl font-semibold tracking-tight">{platform.name}</h1>}
        </div>
      </div>

      {movies.length ? (
        <PosterRail
          title="Movies"
          items={movies.map((m) => ({ id: m.id, type: 'movie', title: m.title, posterUrl: m.posterUrl, logoUrl: m.logoUrl }))}
        />
      ) : null}

      {series.length ? (
        <PosterRail
          title="Series"
          items={series.map((s) => ({ id: s.id, type: 'series', title: s.title, posterUrl: s.posterUrl, logoUrl: s.logoUrl }))}
        />
      ) : null}

      {!movies.length && !series.length ? (
        <div className="text-sm text-white/50">No content assigned to this platform yet.</div>
      ) : null}
    </div>
  )
}
