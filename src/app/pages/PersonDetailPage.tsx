import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import BackButton from '../ui/BackButton'
import Expandable from '../ui/Expandable'
import ContentGrid from '../ui/ContentGrid'
import PosterCollage from '../ui/PosterCollage'
import DetailSection from '../ui/detail/DetailSection'
import { supabase } from '../../lib/supabase'
import { usePageMeta } from '../../lib/usePageMeta'

type Person = {
  id: string
  name: string
  bio: string | null
  birthday: string | null
  place_of_birth: string | null
  known_for_department: string | null
  selected_profile_url: string | null
  social_links: { platform: string; url: string }[]
}

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', color: '#E1306C' },
  x: { label: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z', color: '#fff' },
  facebook: { label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', color: '#1877F2' },
  youtube: { label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', color: '#FF0000' },
  website: { label: 'Website', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z', color: '#60a5fa' },
}

type ContentInfo = {
  id: string; title: string; selected_poster_url: string | null
  selected_logo_url: string | null; tmdb_rating: number | null; year: string | null
}
type Credit = {
  id: string; credit_type: 'cast' | 'crew'; character: string | null; job: string | null
  movie: (ContentInfo & { release_date: string | null }) | null
  series: (ContentInfo & { first_air_date: string | null }) | null
}
type FlatCredit = { creditId: string; content: ContentInfo; to: string; role: string | null; type: 'movie' | 'series' }
type CrewRow = { contentId: string; content: ContentInfo; to: string; jobs: string[]; type: 'movie' | 'series' }
type FilmographyItem = { id: string; title: string; to: string; year: string | null; sub: string }

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value
}

function yearNumber(year: string | null) {
  if (!year) return -1
  const n = Number(year)
  return Number.isFinite(n) ? n : -1
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [tab, setTab] = useState<'cast' | 'crew'>('cast')

  usePageMeta({ title: person?.name ?? 'Person', description: person?.bio ?? null })

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const { data: row } = await supabase
        .from('people')
        .select('id,name,bio,birthday,place_of_birth,known_for_department,selected_profile_url,social_links')
        .eq('id', id).maybeSingle()
      if (!isMounted) return
      setPerson((row ?? null) as Person | null)

      const { data: creditRows } = await supabase
        .from('credits')
        .select('id,credit_type,character,job,movie:movies(id,title,selected_poster_url,selected_logo_url,tmdb_rating,release_date),series:series(id,title,selected_poster_url,selected_logo_url,tmdb_rating,first_air_date)')
        .eq('person_id', id)
        .order('sort_order', { ascending: true })
      if (!isMounted) return
      setCredits((creditRows ?? []) as unknown as Credit[])
    }
    run()
    return () => { isMounted = false }
  }, [id])

  const flatCredits = useMemo((): FlatCredit[] =>
    credits.filter((c) => c.credit_type === 'cast').map((c) => {
      const movie = asOne(c.movie)
      const series = asOne(c.series)
      if (movie) return { creditId: c.id, content: { ...movie, year: movie.release_date?.slice(0, 4) ?? null }, to: `/movie/${movie.id}`, role: c.character, type: 'movie' as const }
      if (series) return { creditId: c.id, content: { ...series, year: series.first_air_date?.slice(0, 4) ?? null }, to: `/series/${series.id}`, role: c.character, type: 'series' as const }
      return null
    }).filter(Boolean) as FlatCredit[]
  , [credits])

  const crewRows = useMemo((): CrewRow[] => {
    const map = new Map<string, CrewRow>()
    for (const c of credits.filter((c) => c.credit_type === 'crew')) {
      const movie = asOne(c.movie); const series = asOne(c.series); const item = movie ?? series
      if (!item) continue
      const year = movie ? (movie as any).release_date?.slice(0, 4) ?? null : (series as any).first_air_date?.slice(0, 4) ?? null
      const to = movie ? `/movie/${item.id}` : `/series/${item.id}`
      if (map.has(item.id)) {
        if (c.job) map.get(item.id)!.jobs.push(c.job)
      } else {
        map.set(item.id, { contentId: item.id, content: { ...item, year }, to, jobs: c.job ? [c.job] : [], type: movie ? 'movie' : 'series' })
      }
    }
    return [...map.values()].sort((a, b) => (b.content.tmdb_rating ?? 0) - (a.content.tmdb_rating ?? 0))
  }, [credits])

  const sortedCast = useMemo(() => [...flatCredits].sort((a, b) => (b.content.tmdb_rating ?? 0) - (a.content.tmdb_rating ?? 0)), [flatCredits])
  const castCount = credits.filter((c) => c.credit_type === 'cast').length
  const FILMOGRAPHY_PREVIEW = 20

  const filmographyCast = useMemo((): FilmographyItem[] => {
    const items = flatCredits.map((c) => ({
      id: c.creditId,
      title: c.content.title,
      to: c.to,
      year: c.content.year,
      sub: c.role?.trim() ? c.role : 'Actor',
    }))
    items.sort((a, b) => {
      const d = yearNumber(b.year) - yearNumber(a.year)
      if (d !== 0) return d
      return a.title.localeCompare(b.title)
    })
    return items
  }, [flatCredits])

  const filmographyCrew = useMemo((): FilmographyItem[] => {
    const items = crewRows.map((r) => ({
      id: r.contentId,
      title: r.content.title,
      to: r.to,
      year: r.content.year,
      sub: r.jobs.length ? r.jobs.join(', ') : 'Crew',
    }))
    items.sort((a, b) => {
      const d = yearNumber(b.year) - yearNumber(a.year)
      if (d !== 0) return d
      return a.title.localeCompare(b.title)
    })
    return items
  }, [crewRows])

  const knownForItems = useMemo(() => {
    const map = new Map<string, { id: string; title: string; to: string; imageUrl: string | null; logoUrl: string | null; badge: string | null; sub: string | null; rating: number }>()
    for (const c of sortedCast) {
      if (!c.content.id) continue
      if (map.has(c.content.id)) continue
      map.set(c.content.id, {
        id: c.content.id,
        title: c.content.title,
        to: c.to,
        imageUrl: c.content.selected_poster_url,
        logoUrl: c.content.selected_logo_url,
        badge: c.content.tmdb_rating ? `★ ${c.content.tmdb_rating}` : null,
        sub: c.content.year ?? null,
        rating: c.content.tmdb_rating ?? 0,
      })
    }
    for (const r of crewRows) {
      if (map.has(r.contentId)) continue
      map.set(r.contentId, {
        id: r.contentId,
        title: r.content.title,
        to: r.to,
        imageUrl: r.content.selected_poster_url,
        logoUrl: r.content.selected_logo_url,
        badge: r.content.tmdb_rating ? `★ ${r.content.tmdb_rating}` : null,
        sub: r.content.year ?? null,
        rating: r.content.tmdb_rating ?? 0,
      })
    }
    // Only include movies, sort by rating, and take top 3
    return [...map.values()]
      .filter(item => item.badge && item.badge.startsWith('★')) // has rating
      .filter(item => item.to.startsWith('/movie/')) // only movies
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(({ rating: _r, ...item }) => item)
  }, [sortedCast, crewRows])

  const collagePosters = useMemo(() =>
    [...flatCredits, ...crewRows.map((r) => ({ content: r.content }))]
      .map((c) => c.content.selected_poster_url)
      .filter(Boolean) as string[]
  , [flatCredits, crewRows])

  if (!person) return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-16">
        <BackButton />
        <div className="mt-4 min-h-[200px] rounded-xl skeleton" />
        <div className="mt-4 h-6 w-40 skeleton rounded-lg" />
        <div className="mt-2 h-4 w-56 skeleton rounded" />
      </div>
    </div>
  )

  const bornLabel = person.birthday
    ? new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <div className="pb-10">
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-4">
        <BackButton />
      </div>

      <div className="mt-4">
        <PosterCollage posters={collagePosters} />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 pt-6">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-4 self-start">
            <section className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
              <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl" style={{ background: 'var(--surface2)' }}>
                  {person.selected_profile_url ? (
                    <img src={person.selected_profile_url} alt={person.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-semibold tracking-tight text-[var(--label)]">{person.name}</h1>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--label2)]">
                    {person.known_for_department ? <span>{person.known_for_department}</span> : null}
                  </div>
                </div>
              </div>

              {person.social_links?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(person.social_links as { platform: string; url: string }[]).map((lnk) => {
                    const meta = PLATFORM_META[lnk.platform]
                    if (!meta || !lnk.url) return null
                    return (
                      <a key={lnk.platform} href={lnk.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium hover:opacity-80 transition-opacity"
                        style={{ background: 'var(--surface2)' }}
                        title={meta.label}>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill={meta.color}>
                          <path d={meta.icon} />
                        </svg>
                        {meta.label}
                      </a>
                    )
                  })}
                </div>
              ) : null}
            </section>

            {(bornLabel || person.place_of_birth) ? (
              <section className="rounded-2xl border p-4 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
                <div className="text-[10px] uppercase tracking-widest text-[var(--label3)]">Personal details</div>
                {bornLabel ? <FactRow label="Born" value={bornLabel} /> : null}
                {person.place_of_birth ? <FactRow label="Place" value={person.place_of_birth} /> : null}
              </section>
            ) : null}
          </aside>

          <main className="space-y-8">
            {person.bio ? (
              <DetailSection title="Biography">
                <Expandable preview={<p className="text-sm leading-relaxed text-[var(--label2)] line-clamp-5">{person.bio}</p>} label="Read more" collapseLabel="Show less">
                  <p className="text-sm leading-relaxed text-[var(--label2)]">{person.bio}</p>
                </Expandable>
              </DetailSection>
            ) : null}

            {knownForItems.length > 0 ? (
              <ContentGrid title="Known for" items={knownForItems} aspect="poster" showLogo={false} />
            ) : null}

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="otl-section-title text-[var(--label)]">Filmography</h2>
                <div className="flex gap-1.5">
                  {(['cast', 'crew'] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={clsx('otl-chip')}
                      data-active={tab === t}>
                      {t === 'cast' ? `Acting (${castCount})` : `Crew (${crewRows.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: 'var(--separator)' }} />

              {tab === 'crew' ? (
                filmographyCrew.length === 0 ? <div className="text-sm text-[var(--label2)]">No crew credits.</div>
                : filmographyCrew.length > FILMOGRAPHY_PREVIEW ? (
                  <Expandable
                    preview={<FilmographyList items={filmographyCrew.slice(0, FILMOGRAPHY_PREVIEW)} />}
                    label={`Show all ${filmographyCrew.length}`}
                    collapseLabel="Show less"
                  >
                    <FilmographyList items={filmographyCrew} />
                  </Expandable>
                ) : <FilmographyList items={filmographyCrew} />
              ) : filmographyCast.length === 0 ? <div className="text-sm text-[var(--label2)]">No acting credits.</div>
              : filmographyCast.length > FILMOGRAPHY_PREVIEW ? (
                <Expandable
                  preview={<FilmographyList items={filmographyCast.slice(0, FILMOGRAPHY_PREVIEW)} />}
                  label={`Show all ${filmographyCast.length}`}
                  collapseLabel="Show less"
                >
                  <FilmographyList items={filmographyCast} />
                </Expandable>
              ) : <FilmographyList items={filmographyCast} />}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-xs text-[var(--label3)]">{label}</div>
      <div className="text-xs font-semibold text-[var(--label)] text-right">{value}</div>
    </div>
  )
}

function FilmographyList({ items }: { items: FilmographyItem[] }) {
  return (
    <div className="columns-1 md:columns-2" style={{ columnGap: '3.5rem' }}>
      {items.map((item) => (
        <div key={item.id} className="break-inside-avoid py-3">
          <div className="flex items-start gap-3">
            <div className="w-12 shrink-0 text-right text-xs tabular-nums text-[var(--label3)]">
              {item.year ?? '—'}
            </div>
            <div className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--label3)' }} />
            <div className="min-w-0">
              <Link to={item.to} className="text-sm font-semibold text-[var(--label)] hover:underline">
                {item.title}
              </Link>
              <div className="mt-0.5 text-xs text-[var(--label2)]">{item.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
