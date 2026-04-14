import { useEffect, useState } from 'react'
import PosterRail from '../ui/PosterRail'
import HomeBanner from '../ui/HomeBanner'
import SkeletonRail from '../ui/SkeletonRail'
import { supabase } from '../../lib/supabase'

type HomeSection = { id: string; title: string }
type HomeCard = { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null }
type BannerItem = { id: string; to: string; title: string; backdropUrl: string | null; logoUrl: string | null; overview: string | null }

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value
}

// removed emoji helper

export default function HomePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [itemsBySection, setItemsBySection] = useState<Record<string, any[]>>({})
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function run() {
      const [{ data: sectionRows }, { data: bannerRows }, { data: itemRows }] = await Promise.all([
        supabase.from('home_sections').select('id,title').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('home_banners').select('id,sort_order,movie:movies(id,title,overview,selected_backdrop_url,selected_logo_url),series:series(id,title,overview,selected_backdrop_url,selected_logo_url)').order('sort_order'),
        supabase.from('home_section_items').select('id,section_id,sort_order,movie:movies(id,title,selected_poster_url,selected_logo_url),series:series(id,title,selected_poster_url,selected_logo_url)').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      ])

      if (!isMounted) return

      setSections((sectionRows ?? []) as HomeSection[])

      const items: BannerItem[] = (bannerRows ?? []).map((b: any) => {
        const movie = Array.isArray(b.movie) ? b.movie[0] : b.movie
        const series = Array.isArray(b.series) ? b.series[0] : b.series
        const content = movie ?? series
        if (!content) return null
        return {
          id: content.id,
          to: movie ? `/movie/${content.id}` : `/series/${content.id}`,
          title: content.title,
          backdropUrl: content.selected_backdrop_url,
          logoUrl: content.selected_logo_url,
          overview: content.overview ?? null,
        }
      }).filter(Boolean) as BannerItem[]
      setBanners(items)

      const grouped: Record<string, any[]> = {}
      for (const row of (itemRows ?? []) as any[]) {
        grouped[row.section_id] ??= []
        grouped[row.section_id].push(row)
      }
      setItemsBySection(grouped)
      setLoading(false)
    }

    run()
    return () => { isMounted = false }
  }, [])

  return (
    <div className="space-y-8 pt-4">
      <HomeBanner items={banners} />

      {loading ? (
        <>
          <SkeletonRail count={6} />
          <SkeletonRail count={6} />
          <SkeletonRail count={6} />
        </>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="text-base font-semibold text-white/70">Nothing here yet.</div>
          <div className="text-sm text-white/40">Start exploring movies and series!</div>
        </div>
      ) : (
        sections.map((section) => {
          const sectionItems = (itemsBySection[section.id] ?? []).map((row: any) => {
            const movie = asOne<HomeCard>(row.movie)
            const series = asOne<HomeCard>(row.series)
            if (movie) return { id: movie.id, type: 'movie' as const, title: movie.title, posterUrl: movie.selected_poster_url, logoUrl: movie.selected_logo_url }
            if (series) return { id: series.id, type: 'series' as const, title: series.title, posterUrl: series.selected_poster_url, logoUrl: series.selected_logo_url }
            return null
          }).filter(Boolean) as Array<{ id: string; type: 'movie' | 'series'; title: string; posterUrl?: string | null; logoUrl?: string | null }>

          return (
            <PosterRail
              key={section.id}
              title={section.title}
              items={sectionItems}
              showLogo={false}
              viewAllTo={sectionItems[0]?.type === 'series' ? '/series' : '/movies'}
            />
          )
        })
      )}
    </div>
  )
}
