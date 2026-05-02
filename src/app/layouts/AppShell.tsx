import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import TopBar from '../ui/TopBar'
import Footer from '../ui/Footer'

export default function AppShell({ noFooter = false }: { noFooter?: boolean }) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  const isHome = !!useMatch({ path: '/', end: true })
  const isMovieDetail = !!useMatch('/movie/:id')
  const isSeriesDetail = !!useMatch('/series/:id')
  const isPersonDetail = !!useMatch('/person/:id')
  const isDetailPage = isMovieDetail || isSeriesDetail || isPersonDetail

  return (
    <div className="min-h-dvh">
      <TopBar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
          className={`mx-auto w-full ${isHome ? 'max-w-none' : 'max-w-screen-2xl'} overflow-x-clip ${
            isDetailPage ? 'pb-24 pt-20 md:pt-20' : isHome ? 'pb-12 pt-20 md:pt-14' : 'px-4 pb-12 pt-20 md:pt-14'
          }`}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!noFooter && <Footer />}
    </div>
  )
}
