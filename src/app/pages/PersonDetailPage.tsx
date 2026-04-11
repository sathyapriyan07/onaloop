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
  social_links: { platform: string; url: string }[]
}

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', color: '#E1306C' },
  x: { label: 'X', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z', color: '#fff' },
  facebook: { label: 'Facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', color: '#1877F2' },
  youtube: { label: 'YouTube', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', color: '#FF0000' },
  spotify: { label: 'Spotify', icon: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z', color: '#1DB954' },
  applemusic: { label: 'Apple Music', icon: 'M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 0 0 1.57-.1c.822-.106 1.596-.35 2.295-.81 1.268-.832 2.01-1.99 2.283-3.46.124-.676.155-1.358.161-2.04.003-.505 0-1.01 0-1.516V6.124zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 0 1 1.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.132-.24.274-.063.457-.23.51-.516a.904.904 0 0 0 .013-.171c0-1.942 0-3.884-.002-5.826 0-.07-.01-.141-.023-.211-.022-.112-.093-.165-.203-.147-.27.046-.54.098-.809.147l-4.659.854c-.155.029-.31.063-.463.098-.19.043-.277.157-.28.354-.002.08 0 .162 0 .243v7.756c0 .415-.056.82-.238 1.197-.285.59-.75.966-1.374 1.148-.356.103-.714.162-1.084.178-.944.04-1.766-.605-1.937-1.54-.148-.795.28-1.657 1.028-2.014.345-.166.71-.254 1.078-.328.368-.073.74-.14 1.106-.222.33-.073.52-.257.554-.59.007-.072.007-.145.007-.218V5.017c0-.073.005-.147.013-.219.02-.146.103-.229.247-.257.14-.026.282-.05.424-.076l5.6-1.025c.144-.026.29-.05.434-.076.19-.033.296.056.3.25.002.062 0 .125 0 .187v6.308z', color: '#fc3c44' },
  youtubemusic: { label: 'YouTube Music', icon: 'M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z', color: '#FF0000' },
  website: { label: 'Website', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z', color: '#60a5fa' },
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
        .select('id,name,bio,birthday,place_of_birth,known_for_department,selected_profile_url,social_links')
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
          {person.social_links?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(person.social_links as { platform: string; url: string }[]).map((lnk) => {
                const meta = PLATFORM_META[lnk.platform]
                if (!meta || !lnk.url) return null
                return (
                  <a key={lnk.platform} href={lnk.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition-colors"
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
