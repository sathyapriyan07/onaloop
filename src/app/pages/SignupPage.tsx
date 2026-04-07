import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function signup() {
    setError(null)
    setIsLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
        />
        {error ? <div className="text-sm text-red-300">{error}</div> : null}
        <Button disabled={isLoading || !email || !password} onClick={signup}>
          Continue
        </Button>
      </div>
      <div className="text-sm text-white/60">
        Already have an account?{' '}
        <Link to="/login" className="text-white underline decoration-white/30 underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  )
}

