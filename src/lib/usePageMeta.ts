import { useEffect } from 'react'

type Meta = {
  title?: string | null
  description?: string | null
}

const APP_NAME = 'OnTheLoop'
const DEFAULT_TITLE = 'OnTheLoop — Discover. Track. Loop.'
const DEFAULT_DESCRIPTION = 'Discover. Track. Loop your favorites. Admin-curated movie & series discovery platform.'

function setDescription(description: string) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (meta) meta.content = description
}

export function usePageMeta({ title, description }: Meta) {
  useEffect(() => {
    const nextTitle = title ? `${title} — ${APP_NAME}` : DEFAULT_TITLE
    document.title = nextTitle
    setDescription(description ?? DEFAULT_DESCRIPTION)
  }, [title, description])
}

