import { Link } from 'react-router-dom'

type Props = {
  to: string
  title: string
  posterUrl?: string | null
}

export default function HomePosterCard({ to, title, posterUrl }: Props) {
  return (
    <Link
      to={to}
      className="group relative block aspect-[2/3] w-[32vw] max-w-[160px] shrink-0 overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : null}
    </Link>
  )
}
