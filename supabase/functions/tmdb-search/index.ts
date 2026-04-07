import { corsHeaders } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/admin.ts'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

type Body = { type: 'movie' | 'series' | 'person'; query: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const admin = await requireAdmin(req)
  if (!admin.ok)
    return new Response(JSON.stringify({ error: admin.error }), {
      status: admin.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const query = (body.query ?? '').trim()
  if (!query)
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const type = body.type
  const endpoint =
    type === 'movie' ? '/search/movie' : type === 'series' ? '/search/tv' : type === 'person' ? '/search/person' : null
  if (!endpoint)
    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const apiKey = requiredEnv('TMDB_API_KEY')
  const url = new URL(TMDB_BASE_URL + endpoint)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', query)
  url.searchParams.set('include_adult', 'false')

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return new Response(JSON.stringify({ error: `TMDb error (${res.status})`, details: text.slice(0, 500) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const data = await res.json()

  const results = Array.isArray(data?.results) ? data.results : []
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

