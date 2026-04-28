import { Link } from 'react-router-dom'

type PersonInfo = { id: string; name: string; selected_profile_url: string | null }

export type PersonCreditRailItem = {
  id: string
  character?: string | null
  job?: string | null
  person: PersonInfo | null
}

export default function PersonCreditRail({ credits, sub = 'character' }: { credits: PersonCreditRailItem[]; sub?: 'character' | 'job' }) {
  // Split credits into two rows
  const row1 = credits.filter((_, i) => i % 2 === 0);
  const row2 = credits.filter((_, i) => i % 2 === 1);

  function renderRow(row: PersonCreditRailItem[]) {
    return (
      <div className="flex gap-3">
        {row.map((c) => c.person && (
          <Link key={c.id} to={`/person/${c.person.id}`} className="snap-start flex w-20 shrink-0 flex-col items-center gap-1 text-center group">
            <div className="h-20 w-20 overflow-hidden rounded-md bg-(--surface2)">
              {c.person.selected_profile_url
                ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-(--label3)">{c.person.name[0]}</div>}
            </div>
            <div className="w-full truncate text-xs font-semibold leading-tight text-(--label2)">{c.person.name}</div>
            {(sub === 'character' ? c.character : c.job) ? (
              <div className="w-full truncate text-[11px] text-(--label2)">{sub === 'character' ? c.character : c.job}</div>
            ) : null}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-x-auto overscroll-x-contain pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {renderRow(row1)}
      {renderRow(row2)}
    </div>
  )
}
