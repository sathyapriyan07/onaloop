import { Outlet } from 'react-router-dom'
import BottomNav from '../ui/BottomNav'
import TopBar from '../ui/TopBar'
import Footer from '../ui/Footer'

export default function AppShell({ noFooter = false }: { noFooter?: boolean }) {
  return (
    <div className="min-h-dvh bg-neutral-950">
      <TopBar />
      <main className="mx-auto w-full max-w-screen-2xl px-4 pb-24 pt-4">
        <Outlet />
      </main>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  )
}

