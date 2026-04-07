export function pickImageUrl(
  selected?: string | null,
  list?: unknown,
  fallback?: string | null,
): string | null {
  if (selected) return selected
  if (Array.isArray(list) && typeof list[0] === 'string') return (list[0] as string) || fallback || null
  return fallback || null
}

