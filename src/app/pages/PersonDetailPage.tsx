import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PosterRail from '../ui/PosterRail'

type Person = {
  id: string
  name: string
  bio: string | null
  selected_profile_url: string | null
}

type Card = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [credits, setCredits] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true
    async function run() {
      if (!id) return
      const { data: row } = await supabase
        .from('people')
        .select('id,name,bio,selected_profile_url')
        .eq('id', id)
        .maybeSingle()
      if (!isMounted) return
      setPerson((row ?? null) as Person | null)

      const { data: creditRows } = await supabase
        .from('credits')
        .select(
          'id, movie:movies(id,title,selected_poster_url,selected_logo_url), series:series(id,title,selected_poster_url,selected_logo_url)',
        )
        .eq('person_id', id)
        .order('sort_order', { ascending: true })
        .limit(60)

      if (!isMounted) return
      setCredits((creditRows ?? []) as any[])
    }
    run()
    return () => {
      isMounted = false
    }
  }, [id])

  if (!person) return <div className="text-white/60">Loading…</div>

  const items = credits
    .map((c: any) => {
      const movie = asOne<Card>(c.movie)
      const series = asOne<Card>(c.series)

      if (movie)
        return {
          id: movie.id,
          type: 'movie' as const,
          title: movie.title,
          posterUrl: movie.selected_poster_url,
          logoUrl: movie.selected_logo_url,
        }
      if (series)
        return {
          id: series.id,
          type: 'series' as const,
          title: series.title,
          posterUrl: series.selected_poster_url,
          logoUrl: series.selected_logo_url,
        }
      return null
    })
    .filter(Boolean) as Array<{
    id: string
    type: 'movie' | 'series'
    title: string
    posterUrl?: string | null
    logoUrl?: string | null
  }>

  return (
    <div className="space-y-6">
      <section className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white/10">
          {person.selected_profile_url ? (
            <img src={person.selected_profile_url} alt={person.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight">{person.name}</h1>
          {person.bio ? <p className="mt-2 line-clamp-4 text-sm text-white/70">{person.bio}</p> : null}
        </div>
      </section>

      <PosterRail title="Filmography" items={items} />
    </div>
  )
}
