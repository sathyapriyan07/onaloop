import { Link } from 'react-router-dom'

export default function AdminBackButton() {
  return (
    <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-[var(--label2)] hover:text-[var(--label)]">
      ← Admin
    </Link>
  )
}
