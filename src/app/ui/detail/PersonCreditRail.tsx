import { Link } from 'react-router-dom'

type PersonInfo = { id: string; name: string; selected_profile_url: string | null }

export type PersonCreditRailItem = {
  id: string
  character?: string | null
  job?: string | null
  person: PersonInfo | null
}

export default function PersonCreditRail({ credits, sub = 'character' }: { credits: PersonCreditRailItem[]; sub?: 'character' | 'job' }) {
  return (
    <div className="snap-x-rail touch-pan-x flex gap-3 overflow-x-auto overscroll-x-contain pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {credits.map((c) => c.person && (
        <Link key={c.id} to={`/person/${c.person.id}`} className="snap-start flex w-14 shrink-0 flex-col items-center gap-1 text-center group">
          <div className="h-14 w-14 overflow-hidden rounded-full" style={{ background: 'var(--surface2)' }}>
            {c.person.selected_profile_url
              ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--label3)]">{c.person.name[0]}</div>}
          </div>
          <div className="w-full truncate text-[10px] font-semibold leading-tight text-[var(--label2)]">{c.person.name}</div>
          {(sub === 'character' ? c.character : c.job) ? (
            <div className="w-full truncate text-[9px] text-[var(--label2)]">{sub === 'character' ? c.character : c.job}</div>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
