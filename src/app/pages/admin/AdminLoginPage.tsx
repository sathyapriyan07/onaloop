import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import { supabase } from '../../../lib/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const redirectTo = location?.state?.from ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function login() {
    setError(null)
    setIsLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      const userId = data.user?.id
      if (!userId) throw new Error('Missing user session')

      const { data: adminRows, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', userId)
      if (adminError) throw adminError

      if (!adminRows?.length) {
        await supabase.auth.signOut()
        throw new Error('Not an admin account.')
      }

      navigate(redirectTo, { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Admin login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-xl font-semibold tracking-tight">Admin login</h1>
        <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          {error ? <div className="text-sm text-red-300">{error}</div> : null}
          <Button disabled={isLoading || !email || !password} onClick={login}>
            Continue
          </Button>
        </div>
        <div className="text-xs text-white/50">
          Admin access is controlled by the `admins` table in Supabase. Users cannot self-upgrade.
        </div>
      </div>
    </div>
  )
}

