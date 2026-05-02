import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAdminGuard } from '../../lib/useAdminGuard'
import TopBar from '../ui/TopBar'

export default function AdminShell() {
  const location = useLocation()
  const { isLoading, isAdmin } = useAdminGuard()

  if (isLoading) return <div className="min-h-dvh skeleton" />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <TopBar />
      <div className="mx-auto w-full max-w-screen-2xl px-4 pt-28 pb-6">
        <Outlet />
      </div>
    </div>
  )
}
