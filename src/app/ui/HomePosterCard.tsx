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
      className="otl-card block aspect-[193/256] w-[32vw] max-w-[160px] shrink-0"
    >
      {posterUrl ? (
        <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
    </Link>
  )
}
