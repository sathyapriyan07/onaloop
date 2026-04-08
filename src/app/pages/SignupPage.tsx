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
    setError(null)
    setIsLoading(true)
    try {
      const { error: e } = await supabase.auth.signUp({ email, password })
      if (e) throw e
      navigate('/', { replace: true })
    } catch (e: any) {
      setError(e?.message ?? 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create account</h1>
          <p className="mt-1 text-sm text-white/60">Join OnTheLoop to discover movies & series</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Email address</label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Mail size={16} className="shrink-0 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-white/50">Password</label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Lock size={16} className="shrink-0 text-white/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && signup()}
                placeholder="Create a password"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="shrink-0 text-white/40 hover:text-white/70">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error ? <div className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">{error}</div> : null}

          <button
            disabled={isLoading || !email || !password}
            onClick={signup}
            className="w-full rounded-2xl bg-indigo-500 py-3.5 text-sm font-bold text-white transition-opacity hover:bg-indigo-400 disabled:opacity-50"
          >
            {isLoading ? 'Creating account…' : 'Create Account →'}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-white/30">
          <div className="h-px flex-1 bg-white/10" />
          OR
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <p className="text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
