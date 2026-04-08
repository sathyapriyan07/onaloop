import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { supabase } from '../../lib/supabase'

type Person = {
  id: string
  name: string
  bio: string | null
  birthday: string | null
  place_of_birth: string | null
  known_for_department: string | null
  selected_profile_url: string | null
}

type ContentInfo = {
  id: string
  title: string
  selected_poster_url: string | null
  selected_logo_url: string | null
  tmdb_rating: number | null
  year: string | null
}

type Credit = {
  id: string
  credit_type: 'cast' | 'crew'
  character: string | null
  job: string | null
  movie: (ContentInfo & { release_date: string | null }) | null
  series: (ContentInfo & { first_air_date: string | null }) | null
}

type FlatCredit = {
  creditId: string
  content: ContentInfo
  to: string
  role: string | null
  type: 'movie' | 'series'
}

type CrewRow = {
  contentId: string
  content: ContentInfo
  to: string
  jobs: string[]
  type: 'movie' | 'series'
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] ?? null) as T | null
  return value
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [credits, setCredits] = useState<Credit[]>([])
  const [tab, setTab] = useState<'cast' | 'crew'>('cast')

  useEffect(() => {
    if (!id) return
    let isMounted = true
    async function run() {
      const { data: row } = await supabase
        .from('people')
        .select('id,name,bio,birthday,place_of_birth,known_for_department,selected_profile_url')
        .eq('id', id)
        .maybeSingle()
      if (!isMounted) return
      setPerson((row ?? null) as Person | null)

      const { data: creditRows } = await supabase
        .from('credits')
        .select(`id,credit_type,character,job,
          movie:movies(id,title,selected_poster_url,selected_logo_url,tmdb_rating,release_date),
          series:series(id,title,selected_poster_url,selected_logo_url,tmdb_rating,first_air_date)`)
        .eq('person_id', id)
        .order('sort_order', { ascending: true })
      if (!isMounted) return
      setCredits((creditRows ?? []) as unknown as Credit[])
    }
    run()
    return () => { isMounted = false }
  }, [id])

  const flatCredits = useMemo((): FlatCredit[] => {
    return credits
      .filter((c) => c.credit_type === 'cast')
      .map((c) => {
        const movie = asOne(c.movie)
        const series = asOne(c.series)
        if (movie) return {
          creditId: c.id,
          content: { ...movie, year: movie.release_date?.slice(0, 4) ?? null },
          to: `/movie/${movie.id}`,
          role: c.character,
          type: 'movie' as const,
        }
        if (series) return {
          creditId: c.id,
          content: { ...series, year: series.first_air_date?.slice(0, 4) ?? null },
          to: `/series/${series.id}`,
          role: c.character,
          type: 'series' as const,
        }
        return null
      })
      .filter(Boolean) as FlatCredit[]
  }, [credits])

  const crewRows = useMemo((): CrewRow[] => {
    const map = new Map<string, CrewRow>()
    for (const c of credits.filter((c) => c.credit_type === 'crew')) {
      const movie = asOne(c.movie)
      const series = asOne(c.series)
      const item = movie ?? series
      if (!item) continue
      const contentId = item.id
      const year = movie ? (movie as any).release_date?.slice(0, 4) ?? null : (series as any).first_air_date?.slice(0, 4) ?? null
      const to = movie ? `/movie/${contentId}` : `/series/${contentId}`
      if (map.has(contentId)) {
        if (c.job) map.get(contentId)!.jobs.push(c.job)
      } else {
        map.set(contentId, {
          contentId,
          content: { ...item, year },
          to,
          jobs: c.job ? [c.job] : [],
          type: movie ? 'movie' : 'series',
        })
      }
    }
    return [...map.values()].sort((a, b) => (b.content.tmdb_rating ?? 0) - (a.content.tmdb_rating ?? 0))
  }, [credits])

  const sorted = useMemo(() =>
    [...flatCredits].sort((a, b) => (b.content.tmdb_rating ?? 0) - (a.content.tmdb_rating ?? 0)),
    [flatCredits]
  )

  const top = sorted.slice(0, 6)
  const rest = sorted.slice(6)

  const castCount = credits.filter((c) => c.credit_type === 'cast').length
  const crewCount = credits.filter((c) => c.credit_type === 'crew').length

  if (!person) return <div className="text-white/60">Loading…</div>

  return (
    <div className="space-y-6">
      <section className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/10">
          {person.selected_profile_url
            ? <img src={person.selected_profile_url} alt={person.name} className="h-full w-full object-cover" />
            : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">{person.name}</h1>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/50">
            {person.known_for_department ? <span>{person.known_for_department}</span> : null}
            {person.birthday ? <span>Born {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span> : null}
            {person.place_of_birth ? <span>{person.place_of_birth}</span> : null}
          </div>
          {person.bio ? <p className="mt-2 line-clamp-4 text-sm text-white/70">{person.bio}</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Filmography</h2>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            {(['cast', 'crew'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  tab === t ? 'bg-white text-neutral-950' : 'text-white/60 hover:text-white')}>
                {t === 'cast' ? `Acting (${castCount})` : `Crew (${crewRows.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'crew' ? (
          crewRows.length === 0 ? (
            <div className="text-sm text-white/50">No crew credits.</div>
          ) : (
            <div className="space-y-1">
              {crewRows.map(({ contentId, content, to, jobs }) => (
                <Link key={contentId} to={to}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
                  <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {content.selected_poster_url
                      ? <img src={content.selected_poster_url} alt={content.title} className="h-full w-full object-cover" />
                      : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-semibold">{content.title}</div>
                    {jobs.length ? <div className="truncate text-xs text-white/50">{jobs.join(' · ')}</div> : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {content.tmdb_rating ? <div className="text-xs text-white/60">★ {content.tmdb_rating}</div> : null}
                    {content.year ? <div className="text-xs text-white/40">{content.year}</div> : null}
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : flatCredits.length === 0 ? (
          <div className="text-sm text-white/50">No acting credits.</div>
        ) : (
          <div className="space-y-6">
            {top.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {top.map(({ creditId, content, to, role }) => (
                  <Link key={creditId} to={to} className="group space-y-1.5">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {content.selected_poster_url ? (
                        <img src={content.selected_poster_url} alt={content.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/50">{content.title}</div>
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      {content.tmdb_rating ? (
                        <div className="absolute right-2 top-2 rounded-lg bg-black/60 px-1.5 py-0.5 text-xs font-semibold">★ {content.tmdb_rating}</div>
                      ) : null}
                      {content.selected_logo_url ? (
                        <div className="absolute inset-x-0 bottom-0 p-2">
                          <img src={content.selected_logo_url} alt={content.title} className="max-h-8 w-auto max-w-full object-contain drop-shadow-lg" />
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <div className="truncate text-xs font-semibold">{content.title}</div>
                      {role ? <div className="truncate text-xs text-white/50">{role}</div> : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div className="space-y-1">
                {rest.map(({ creditId, content, to, role }) => (
                  <Link key={creditId} to={to}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
                    <div className="h-10 w-7 shrink-0 overflow-hidden rounded-lg bg-white/10">
                      {content.selected_poster_url
                        ? <img src={content.selected_poster_url} alt={content.title} className="h-full w-full object-cover" />
                        : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold">{content.title}</div>
                      {role ? <div className="truncate text-xs text-white/50">{role}</div> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      {content.tmdb_rating ? <div className="text-xs text-white/60">★ {content.tmdb_rating}</div> : null}
                      {content.year ? <div className="text-xs text-white/40">{content.year}</div> : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
