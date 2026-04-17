import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAdminGuard } from '../../lib/useAdminGuard'
import FloatingBar from '../ui/FloatingBar'

export default function AdminShell() {
  const location = useLocation()
  const { isLoading, isAdmin } = useAdminGuard()

  if (isLoading) return <div className="min-h-dvh skeleton" />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <FloatingBar />
      <div className="mx-auto w-full max-w-screen-2xl px-4 pt-20 pb-6">
        <Outlet />
      </div>
    </div>
  )
}
