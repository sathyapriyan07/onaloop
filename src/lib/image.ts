export function pickImageUrl(
  selected?: string | null,
  list?: unknown,
  fallback?: string | null,
): string | null {
  if (selected) return selected
  if (Array.isArray(list) && typeof list[0] === 'string') return (list[0] as string) || fallback || null
  return fallback || null
}

/** Append a width hint to Supabase Storage URLs for lighter payloads */
export function imgSrc(url: string | null | undefined, width: number): string | null {
  if (!url) return null
  // Only transform Supabase storage URLs
  if (!url.includes('/storage/v1/object/')) return url
  return `${url}?width=${width}&quality=80`
}

