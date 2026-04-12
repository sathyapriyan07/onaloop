import ContentRail from './ContentRail'

type Item = {
  id: string
  title: string
  posterUrl?: string | null
  logoUrl?: string | null
  type: 'movie' | 'series'
}

export default function PosterRail({ title, items, showLogo = true }: { title: string; items: Item[]; showLogo?: boolean }) {
  return (
    <ContentRail
      title={title}
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        to: item.type === 'movie' ? `/movie/${item.id}` : `/series/${item.id}`,
        imageUrl: item.posterUrl ?? null,
        logoUrl: item.logoUrl ?? null,
      }))}
      aspect="poster"
      showLogo={showLogo}
    />
  )
}
