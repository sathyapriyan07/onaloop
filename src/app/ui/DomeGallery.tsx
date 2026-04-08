import { useEffect, useMemo, useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'
import './DomeGallery.css'

type ImageItem = { src: string; alt?: string }

const DEFAULTS = { maxVerticalRotationDeg: 5, dragSensitivity: 20, enlargeTransitionMs: 300, segments: 35 }

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg: number) => { const a = (((deg + 180) % 360) + 360) % 360; return a - 180 }
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = (el as any).dataset[name] ?? el.getAttribute(`data-${name}`)
  const n = attr == null ? NaN : parseFloat(attr)
  return Number.isFinite(n) ? n : fallback
}

function buildItems(pool: ImageItem[], seg: number) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-4, -2, 0, 2, 4]
  const oddYs = [-3, -1, 1, 3, 5]
  const coords = xCols.flatMap((x, c) => (c % 2 === 0 ? evenYs : oddYs).map(y => ({ x, y, sizeX: 2, sizeY: 2 })))
  if (!pool.length) return coords.map(c => ({ ...c, src: '', alt: '' }))
  const used = Array.from({ length: coords.length }, (_, i) => pool[i % pool.length])
  return coords.map((c, i) => ({ ...c, src: used[i].src, alt: used[i].alt ?? '' }))
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2
  return { rotateX: unit * (offsetY - (sizeY - 1) / 2), rotateY: unit * (offsetX + (sizeX - 1) / 2) }
}

type Props = {
  images: ImageItem[]
  fit?: number
  minRadius?: number
  maxVerticalRotationDeg?: number
  segments?: number
  dragDampening?: number
  grayscale?: boolean
  overlayBlurColor?: string
  openedImageWidth?: string
  openedImageHeight?: string
  imageBorderRadius?: string
  openedImageBorderRadius?: string
}

export default function DomeGallery({
  images,
  fit = 0.5,
  minRadius = 600,
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  grayscale = false,
  overlayBlurColor = '#0a0a0a',
  openedImageWidth: _openedImageWidth = '250px',
  openedImageHeight: _openedImageHeight = '350px',
  imageBorderRadius = '20px',
  openedImageBorderRadius = '20px',
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const focusedElRef = useRef<HTMLElement | null>(null)
  const originalTilePositionRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
  const rotationRef = useRef({ x: 0, y: 0 })
  const startRotRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const inertiaRAF = useRef<number | null>(null)
  const openingRef = useRef(false)
  const openStartedAtRef = useRef(0)
  const lastDragEndAt = useRef(0)
  const scrollLockedRef = useRef(false)
  const lockedRadiusRef = useRef<number | null>(null)

  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return
    scrollLockedRef.current = true
    document.body.classList.add('dg-scroll-lock')
  }, [])

  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return
    if (rootRef.current?.getAttribute('data-enlarging') === 'true') return
    scrollLockedRef.current = false
    document.body.classList.remove('dg-scroll-lock')
  }, [])

  const items = useMemo(() => buildItems(images, segments), [images, segments])

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current
    if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
  }

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect
      const w = Math.max(1, cr.width), h = Math.max(1, cr.height)
      let radius = Math.min(w, h) * fit
      radius = Math.min(radius, h * 1.35)
      radius = clamp(radius, minRadius, Infinity)
      lockedRadiusRef.current = Math.round(radius)
      root.style.setProperty('--radius', `${lockedRadiusRef.current}px`)
      root.style.setProperty('--viewer-pad', `${Math.max(8, Math.round(Math.min(w, h) * 0.25))}px`)
      root.style.setProperty('--overlay-blur-color', overlayBlurColor)
      root.style.setProperty('--tile-radius', imageBorderRadius)
      root.style.setProperty('--enlarge-radius', openedImageBorderRadius)
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
      applyTransform(rotationRef.current.x, rotationRef.current.y)
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [fit, minRadius, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius])

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null }
  }, [])

  const startInertia = useCallback((vx: number, vy: number) => {
    let vX = clamp(vx, -1.4, 1.4) * 80, vY = clamp(vy, -1.4, 1.4) * 80
    const d = clamp(dragDampening ?? 0.6, 0, 1)
    const frictionMul = 0.94 + 0.055 * d
    const stopThreshold = 0.015 - 0.01 * d
    const maxFrames = Math.round(90 + 270 * d)
    let frames = 0
    const step = () => {
      vX *= frictionMul; vY *= frictionMul
      if ((Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) || ++frames > maxFrames) { inertiaRAF.current = null; return }
      const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
      const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200)
      rotationRef.current = { x: nextX, y: nextY }
      applyTransform(nextX, nextY)
      inertiaRAF.current = requestAnimationFrame(step)
    }
    stopInertia()
    inertiaRAF.current = requestAnimationFrame(step)
  }, [dragDampening, maxVerticalRotationDeg, stopInertia])

  useGesture({
    onDragStart: ({ event }) => {
      if (focusedElRef.current) return
      stopInertia()
      const evt = event as MouseEvent
      draggingRef.current = true; movedRef.current = false
      startRotRef.current = { ...rotationRef.current }
      startPosRef.current = { x: evt.clientX, y: evt.clientY }
    },
    onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
      if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return
      const evt = event as MouseEvent
      const dxTotal = evt.clientX - startPosRef.current.x
      const dyTotal = evt.clientY - startPosRef.current.y
      if (!movedRef.current && dxTotal * dxTotal + dyTotal * dyTotal > 16) movedRef.current = true
      const nextX = clamp(startRotRef.current.x - dyTotal / DEFAULTS.dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg)
      const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / DEFAULTS.dragSensitivity)
      rotationRef.current = { x: nextX, y: nextY }
      applyTransform(nextX, nextY)
      if (last) {
        draggingRef.current = false
        let [vMagX, vMagY] = velocity; const [dirX, dirY] = direction
        let vx = vMagX * dirX, vy = vMagY * dirY
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
          const [mx, my] = movement as number[]
          vx = clamp((mx / DEFAULTS.dragSensitivity) * 0.02, -1.2, 1.2)
          vy = clamp((my / DEFAULTS.dragSensitivity) * 0.02, -1.2, 1.2)
        }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy)
        if (movedRef.current) lastDragEndAt.current = performance.now()
        movedRef.current = false
      }
    }
  }, { target: mainRef, eventOptions: { passive: true } })

  const openItemFromElement = useCallback((el: HTMLElement) => {
    if (openingRef.current) return
    openingRef.current = true; openStartedAtRef.current = performance.now(); lockScroll()
    const parent = el.parentElement!
    focusedElRef.current = el
    const offsetX = getDataNumber(parent, 'offsetX', 0), offsetY = getDataNumber(parent, 'offsetY', 0)
    const sizeX = getDataNumber(parent, 'sizeX', 2), sizeY = getDataNumber(parent, 'sizeY', 2)
    const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments)
    const rotY = (() => { let r = -(normalizeAngle(parentRot.rotateY) + normalizeAngle(rotationRef.current.y)) % 360; if (r < -180) r += 360; return r })()
    const rotX = -parentRot.rotateX - rotationRef.current.x
    parent.style.setProperty('--rot-y-delta', `${rotY}deg`)
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`)
    const refDiv = document.createElement('div')
    refDiv.className = 'item__image item__image--reference'
    refDiv.style.opacity = '0'
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
    parent.appendChild(refDiv)
    void refDiv.offsetHeight
    const tileR = refDiv.getBoundingClientRect()
    const mainR = mainRef.current?.getBoundingClientRect()
    const frameR = frameRef.current?.getBoundingClientRect()
    if (!mainR || !frameR || tileR.width <= 0) { openingRef.current = false; focusedElRef.current = null; parent.removeChild(refDiv); unlockScroll(); return }
    originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height }
    el.style.visibility = 'hidden'; el.style.zIndex = '0'
    const overlay = document.createElement('div')
    overlay.className = 'enlarge'
    overlay.style.cssText = `position:absolute;left:${frameR.left - mainR.left}px;top:${frameR.top - mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${DEFAULTS.enlargeTransitionMs}ms ease,opacity ${DEFAULTS.enlargeTransitionMs}ms ease;`
    const img = document.createElement('img')
    img.src = parent.dataset.src || el.querySelector('img')?.src || ''
    overlay.appendChild(img)
    viewerRef.current!.appendChild(overlay)
    const sx0 = tileR.width / frameR.width, sy0 = tileR.height / frameR.height
    overlay.style.transform = `translate(${tileR.left - frameR.left}px,${tileR.top - frameR.top}px) scale(${sx0 > 0 ? sx0 : 1},${sy0 > 0 ? sy0 : 1})`
    setTimeout(() => {
      if (!overlay.parentElement) return
      overlay.style.opacity = '1'; overlay.style.transform = 'translate(0,0) scale(1,1)'
      rootRef.current?.setAttribute('data-enlarging', 'true')
    }, 16)
  }, [lockScroll, segments, unlockScroll])

  useEffect(() => {
    const scrim = scrimRef.current; if (!scrim) return
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return
      const el = focusedElRef.current; if (!el) return
      const parent = el.parentElement!
      const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null
      if (!overlay) return
      const refDiv = parent.querySelector('.item__image--reference') as HTMLElement | null
      overlay.remove()
      if (refDiv) refDiv.remove()
      parent.style.setProperty('--rot-y-delta', '0deg')
      parent.style.setProperty('--rot-x-delta', '0deg')
      el.style.visibility = ''; el.style.zIndex = '0'
      focusedElRef.current = null
      rootRef.current?.removeAttribute('data-enlarging')
      openingRef.current = false; unlockScroll()
    }
    scrim.addEventListener('click', close)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => { scrim.removeEventListener('click', close); window.removeEventListener('keydown', onKey) }
  }, [unlockScroll])

  const onTileClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingRef.current || movedRef.current || performance.now() - lastDragEndAt.current < 80 || openingRef.current) return
    openItemFromElement(e.currentTarget)
  }, [openItemFromElement])

  useEffect(() => () => { document.body.classList.remove('dg-scroll-lock') }, [])

  return (
    <div ref={rootRef} className="sphere-root" style={{ ['--segments-x' as any]: segments, ['--segments-y' as any]: segments, ['--overlay-blur-color' as any]: overlayBlurColor, ['--tile-radius' as any]: imageBorderRadius, ['--enlarge-radius' as any]: openedImageBorderRadius, ['--image-filter' as any]: grayscale ? 'grayscale(1)' : 'none' }}>
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div key={`${it.x},${it.y},${i}`} className="item" data-src={it.src} data-offset-x={it.x} data-offset-y={it.y} data-size-x={it.sizeX} data-size-y={it.sizeY}
                style={{ ['--offset-x' as any]: it.x, ['--offset-y' as any]: it.y, ['--item-size-x' as any]: it.sizeX, ['--item-size-y' as any]: it.sizeY }}>
                <div className="item__image" role="button" tabIndex={0} aria-label={it.alt || 'Open image'} onClick={onTileClick}>
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  )
}
