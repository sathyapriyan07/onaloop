import { createClient } from 'npm:@supabase/supabase-js@2'

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function supabaseAdminClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'))
}

export async function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null
  if (!token) return { ok: false as const, status: 401, error: 'Missing bearer token' }

  const supabase = supabaseAdminClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return { ok: false as const, status: 401, error: 'Invalid session' }

  const userId = data.user.id
  const { data: rows, error: adminError } = await supabase.from('admins').select('user_id').eq('user_id', userId)
  if (adminError) return { ok: false as const, status: 500, error: adminError.message }
  if (!rows?.length) return { ok: false as const, status: 403, error: 'Admin access required' }

  return { ok: true as const, userId, supabase }
}

