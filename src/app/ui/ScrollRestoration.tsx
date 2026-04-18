import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const STORAGE_KEY = 'otl-scroll'

type ScrollMap = Record<string, number>

function readMap(): ScrollMap {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as ScrollMap
  } catch {
    return {}
  }
}

function writeMap(map: ScrollMap) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export default function ScrollRestoration() {
  const location = useLocation()
  const navType = useNavigationType()
  const lastKeyRef = useRef<string | null>(null)

  useEffect(() => {
    lastKeyRef.current = location.key
  }, [location.key])

  useEffect(() => {
    const onScroll = () => {
      const key = lastKeyRef.current
      if (!key) return
      const map = readMap()
      map[key] = window.scrollY
      writeMap(map)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    const key = location.key
    const map = readMap()
    const y = navType === 'POP' ? (map[key] ?? 0) : 0
    requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: 'auto' }))
  }, [location.key, navType])

  return null
}
