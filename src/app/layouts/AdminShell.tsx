import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAdminGuard } from '../../lib/useAdminGuard'

export default function AdminShell() {
  const location = useLocation()
  const { isLoading, isAdmin } = useAdminGuard()

  if (isLoading) return <div className="min-h-dvh theme-bg" />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  return (
    <div className="min-h-dvh theme-bg">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}

