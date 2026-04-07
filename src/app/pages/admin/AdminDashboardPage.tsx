import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import Button from '../../ui/Button'

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
          <p className="mt-1 text-sm text-white/60">Import from TMDb and manage homepage sections.</p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/'
          }}
        >
          Sign out
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/import"
          className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
        >
          <div className="text-sm font-semibold">TMDb Import</div>
          <div className="mt-1 text-xs text-white/60">Search TMDb and import movies/series/people.</div>
        </Link>
        <Link
          to="/admin/home"
          className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
        >
          <div className="text-sm font-semibold">Homepage Sections</div>
          <div className="mt-1 text-xs text-white/60">Curate rails on the homepage.</div>
        </Link>
      </div>
    </div>
  )
}

