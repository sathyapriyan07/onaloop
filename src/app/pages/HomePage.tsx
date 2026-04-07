import { useEffect, useState } from 'react'
import PosterRail from '../ui/PosterRail'
import { supabase } from '../../lib/supabase'

type HomeSection = {
  id: string
  title: string
}

type HomeCard = {
  id: string
  title: string
  selected_poster_url: string | null
  selected_logo_url: string | null
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value
}

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [itemsBySection, setItemsBySection] = useState<Record<string, any[]>>({})

  useEffect(() => {
    let isMounted = true
    async function run() {
      const { data: sectionRows } = await supabase
        .from('home_sections')
        .select('id,title')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (!isMounted) return
      setSections((sectionRows ?? []) as HomeSection[])

      const { data: itemRows } = await supabase
        .from('home_section_items')
        .select(
          'id,section_id,sort_order, movie:movies(id,title,selected_poster_url,selected_logo_url), series:series(id,title,selected_poster_url,selected_logo_url)',
        )
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (!isMounted) return
      const grouped: Record<string, any[]> = {}
      for (const row of (itemRows ?? []) as any[]) {
        grouped[row.section_id] ??= []
        grouped[row.section_id].push(row)
      }
      setItemsBySection(grouped as any)
    }

    run()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Discover</h1>
        <p className="text-sm text-white/60">Admin-curated movies, series, and people.</p>
      </section>

      {sections.map((section) => {
        const items = (itemsBySection[section.id] ?? []).map((row: any) => {
          const movie = asOne<HomeCard>(row.movie)
          const series = asOne<HomeCard>(row.series)

          if (movie) {
              return {
                id: movie.id,
                type: 'movie' as const,
                title: movie.title,
                posterUrl: movie.selected_poster_url,
                logoUrl: movie.selected_logo_url,
              }
          }
          if (series) {
              return {
                id: series.id,
                type: 'series' as const,
                title: series.title,
                posterUrl: series.selected_poster_url,
                logoUrl: series.selected_logo_url,
              }
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

        return <PosterRail key={section.id} title={section.title} items={items} />
      })}
    </div>
  )
}
