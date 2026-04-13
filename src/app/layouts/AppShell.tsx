import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from '../ui/BottomNav'
import TopBar from '../ui/TopBar'
import Footer from '../ui/Footer'

export default function AppShell({ noFooter = false }: { noFooter?: boolean }) {
  const location = useLocation()

  return (
    <div className="min-h-dvh" style={{ background: '#0f0f0f' }}>
      <TopBar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mx-auto w-full max-w-screen-2xl px-4 pb-24 pt-4 overflow-x-clip"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  )
}
