import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { supabase } from '../../lib/supabase'

type Person = {
  id: string
  name: string
  bio: string | null
  selected_profile_url: string | null
}

type Credit = {
  id: string
  credit_type: 'cast' | 'crew'
  character: string | null
  job: string | null
  movie: { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null } | null
  series: { id: string; title: string; selected_poster_url: string | null; selected_logo_url: string | null } | null
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
        .select('id,name,bio,selected_profile_url')
        .eq('id', id)
        .maybeSingle()
      if (!isMounted) return
      setPerson((row ?? null) as Person | null)

      const { data: creditRows } = await supabase
        .from('credits')
        .select('id,credit_type,character,job,movie:movies(id,title,selected_poster_url,selected_logo_url),series:series(id,title,selected_poster_url,selected_logo_url)')
        .eq('person_id', id)
        .order('sort_order', { ascending: true })
      if (!isMounted) return
      setCredits((creditRows ?? []) as unknown as Credit[])
    }
    run()
    return () => { isMounted = false }
  }, [id])

  if (!person) return <div className="text-white/60">Loading…</div>

  const castCredits = credits.filter((c) => c.credit_type === 'cast')
  const crewCredits = credits.filter((c) => c.credit_type === 'crew')
  const active = tab === 'cast' ? castCredits : crewCredits

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
          {person.bio ? <p className="mt-2 line-clamp-4 text-sm text-white/70">{person.bio}</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">Filmography</h2>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            {(['cast', 'crew'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  tab === t ? 'bg-white text-neutral-950' : 'text-white/60 hover:text-white',
                )}
              >
                {t === 'cast' ? `Acting (${castCredits.length})` : `Crew (${crewCredits.length})`}
              </button>
            ))}
          </div>
        </div>

        {active.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {active.map((c) => {
              const movie = asOne(c.movie)
              const series = asOne(c.series)
              const content = movie ?? series
              if (!content) return null
              const to = movie ? `/movie/${content.id}` : `/series/${content.id}`
              const role = tab === 'cast' ? c.character : c.job
              return (
                <Link key={c.id} to={to} className="group space-y-1.5">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {content.selected_poster_url ? (
                      <img
                        src={content.selected_poster_url}
                        alt={content.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-white/50">
                        {content.title}
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
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
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-white/50">No {tab === 'cast' ? 'acting' : 'crew'} credits.</div>
        )}
      </section>
    </div>
  )
}
