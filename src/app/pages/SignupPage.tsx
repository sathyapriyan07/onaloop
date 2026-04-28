import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../ui/AuthLayout'
import { supabase } from '../../lib/supabase'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function signup() {
    setError(null); setIsLoading(true)
    try {
      const { error: e } = await supabase.auth.signUp({ email, password })
      if (e) throw e
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed')
    } finally { setIsLoading(false) }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-7">
        <div>
          <h1 className="otl-title text-[var(--label)]">Create account</h1>
          <p className="mt-1 text-sm text-[var(--label3)]">Join OnTheLoop to discover movies & series</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
            <Mail size={15} className="shrink-0 text-[var(--label3)]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 bg-transparent text-sm text-[var(--label)] placeholder:text-[var(--label3)] outline-none" />
          </div>

          <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border" style={{ background: 'var(--surface)', borderColor: 'var(--separator)' }}>
            <Lock size={15} className="shrink-0 text-[var(--label3)]" />
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && signup()}
              placeholder="Create a password"
              className="flex-1 bg-transparent text-sm text-[var(--label)] placeholder:text-[var(--label3)] outline-none" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="shrink-0 text-[var(--label3)] hover:text-[var(--label2)] transition-colors">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && <div className="rounded-xl px-4 py-2.5 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.15)' }}>{error}</div>}

          <button disabled={isLoading || !email || !password} onClick={signup}
            className="w-full rounded-2xl py-3.5 text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </div>

        <p className="text-center text-sm text-[var(--label3)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:opacity-80">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
