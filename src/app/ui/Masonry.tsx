import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './Masonry.css'

type MasonryItem = {
  id: string
  img: string
  url: string
  height: number
}

type Props = {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'random'
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
  onItemClick?: (id: string) => void
}

const useMedia = (queries: string[], values: number[], defaultValue: number) => {
  const get = () => values[queries.findIndex(q => matchMedia(q).matches)] ?? defaultValue
  const [value, setValue] = useState(get)
  useEffect(() => {
    const handler = () => setValue(get)
    queries.forEach(q => matchMedia(q).addEventListener('change', handler))
    return () => queries.forEach(q => matchMedia(q).removeEventListener('change', handler))
  }, [])
  return value
}

const useMeasure = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

export default function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  onItemClick,
}: Props) {
  const columns = useMedia(
    ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)'],
    [5, 4, 3, 2],
    2
  )

  const [containerRef, { width }] = useMeasure()
  const [imagesReady, setImagesReady] = useState(false)
  const hasMounted = useRef(false)

  useEffect(() => {
    hasMounted.current = false
    setImagesReady(false)
    Promise.all(items.map(i => new Promise<void>(res => {
      const img = new Image(); img.src = i.img; img.onload = img.onerror = () => res()
    }))).then(() => setImagesReady(true))
  }, [items])

  const grid = useMemo(() => {
    if (!width) return []
    const colHeights = new Array(columns).fill(0)
    const colW = width / columns
    return items.map(child => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = colW * col
      const h = child.height / 2
      const y = colHeights[col]
      colHeights[col] += h
      return { ...child, x, y, w: colW, h }
    })
  }, [columns, items, width])

  const totalHeight = useMemo(() => {
    if (!grid.length) return 0
    return Math.max(...grid.map(i => i.y + i.h))
  }, [grid])

  useLayoutEffect(() => {
    if (!imagesReady) return
    grid.forEach((item, index) => {
      const sel = `[data-masonry-key="${item.id}"]`
      const props = { x: item.x, y: item.y, width: item.w, height: item.h }
      if (!hasMounted.current) {
        let ix = item.x, iy = item.y
        const dir = animateFrom === 'random'
          ? (['top','bottom','left','right'] as const)[Math.floor(Math.random() * 4)]
          : animateFrom
        if (dir === 'top') iy = -200
        else if (dir === 'bottom') iy = window.innerHeight + 200
        else if (dir === 'left') ix = -200
        else if (dir === 'right') ix = window.innerWidth + 200
        gsap.fromTo(sel,
          { opacity: 0, x: ix, y: iy, width: item.w, height: item.h, ...(blurToFocus && { filter: 'blur(10px)' }) },
          { opacity: 1, ...props, ...(blurToFocus && { filter: 'blur(0px)' }), duration: 0.8, ease: 'power3.out', delay: index * stagger }
        )
      } else {
        gsap.to(sel, { ...props, duration, ease, overwrite: 'auto' })
      }
    })
    hasMounted.current = true
  }, [grid, imagesReady])

  return (
    <div ref={containerRef} className="masonry-list" style={{ height: totalHeight }}>
      {grid.map(item => (
        <div
          key={item.id}
          data-masonry-key={item.id}
          className="masonry-item"
          onClick={() => onItemClick ? onItemClick(item.id) : window.open(item.url, '_blank', 'noopener')}
          onMouseEnter={() => scaleOnHover && gsap.to(`[data-masonry-key="${item.id}"]`, { scale: hoverScale, duration: 0.3, ease: 'power2.out' })}
          onMouseLeave={() => scaleOnHover && gsap.to(`[data-masonry-key="${item.id}"]`, { scale: 1, duration: 0.3, ease: 'power2.out' })}
        >
          <div className="masonry-img" style={{ backgroundImage: `url(${item.img})` }} />
        </div>
      ))}
    </div>
  )
}
