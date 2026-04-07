function requiredEnv(name: string): string {
  const value = import.meta.env[name]
  if (!value || typeof value !== 'string') throw new Error(`Missing env var: ${name}`)
  return value
}

export const env = {
  supabaseUrl: requiredEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: requiredEnv('VITE_SUPABASE_ANON_KEY'),
  tmdbApiKey: requiredEnv('VITE_TMDB_API_KEY'),
}

