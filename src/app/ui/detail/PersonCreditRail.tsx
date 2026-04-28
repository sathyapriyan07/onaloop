import { Link } from 'react-router-dom'

type PersonInfo = { id: string; name: string; selected_profile_url: string | null }

export type PersonCreditRailItem = {
  id: string
  character?: string | null
  job?: string | null
  person: PersonInfo | null
}

export default function PersonCreditRail({ credits, sub = 'character' }: { credits: PersonCreditRailItem[]; sub?: 'character' | 'job' }) {
  // Group credits into pairs for 2 per row
  const rows: PersonCreditRailItem[][] = [];
  for (let i = 0; i < credits.length; i += 2) {
    rows.push(credits.slice(i, i + 2));
  }

  return (
    <div className="flex flex-col gap-2 bg-transparent">
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-4">
          {row.map((c) => c.person && (
            <Link
              key={c.id}
              to={`/person/${c.person.id}`}
              className="flex flex-1 min-w-0 items-center gap-4 py-3 px-2 hover:bg-(--surface2) transition-colors rounded-md"
              style={{ alignSelf: 'stretch' }}
            >
              <div className="h-10 w-10 min-w-10 min-h-10 overflow-hidden rounded-full bg-(--surface2) flex items-center justify-center">
                {c.person.selected_profile_url
                  ? <img src={c.person.selected_profile_url} alt={c.person.name} className="h-full w-full object-cover" />
                  : <div className="flex h-full w-full items-center justify-center text-lg font-bold text-(--label3)">{c.person.name[0]}</div>}
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <span className="truncate font-semibold text-[13px] text-(--label2)">{c.person.name}</span>
                {(sub === 'character' ? c.character : c.job) && (
                  <span className="truncate text-[11px] text-(--label2)">{sub === 'character' ? c.character : c.job}</span>
                )}
              </div>
            </Link>
          ))}
          {/* If odd number, fill empty space for alignment */}
          {row.length === 1 && <div className="flex-1" />}
        </div>
      ))}
    </div>
  )
}
