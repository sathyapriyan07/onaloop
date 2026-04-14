import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from '../ui/BottomNav'
import FloatingBar from '../ui/FloatingBar'
import Footer from '../ui/Footer'

export default function AppShell({ noFooter = false }: { noFooter?: boolean }) {
  const location = useLocation()

  const isMovieDetail = !!useMatch('/movie/:id')
  const isSeriesDetail = !!useMatch('/series/:id')
  const isPersonDetail = !!useMatch('/person/:id')
  const isDetailPage = isMovieDetail || isSeriesDetail || isPersonDetail

  return (
    <div className="min-h-dvh" style={{ background: '#000' }}>
      {!isDetailPage && <FloatingBar />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`mx-auto w-full max-w-screen-2xl overflow-x-clip ${
            isDetailPage ? 'pb-24' : 'px-4 pb-24 pt-16'
          }`}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  )
}
