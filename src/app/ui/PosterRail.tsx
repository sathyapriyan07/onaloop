import ContentRail from './ContentRail'

type Item = {
  id: string
  title: string
  posterUrl?: string | null
  logoUrl?: string | null
  type: 'movie' | 'series'
  rating?: number | null
  year?: string | null
  loopScore?: number | null
}

type Props = {
  title: string
  items: Item[]
  showLogo?: boolean
  emoji?: string
  viewAllTo?: string
}

export default function PosterRail({ title, items, showLogo = true, emoji, viewAllTo }: Props) {
  return (
    <ContentRail
      title={title}
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        to: item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`,
        imageUrl: item.posterUrl ?? null,
        logoUrl: item.logoUrl ?? null,
        rating: item.rating,
        year: item.year,
        loopScore: item.loopScore,
      }))}
      aspect="poster"
      showLogo={showLogo}
      emoji={emoji}
      viewAllTo={viewAllTo}
    />
  )
}
