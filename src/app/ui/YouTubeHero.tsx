import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

type Props = { videoId: string }

const BASE = (id: string) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&fs=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`

const stores = new Map<string, {
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  listeners: Set<() => void>
  muted: boolean
  playing: boolean
  startTime: number
  startWall: number
}>()

function getStore(videoId: string) {
  if (!stores.has(videoId)) {
    stores.set(videoId, {
      iframeRef: { current: null },
      listeners: new Set(),
      muted: true,
      playing: true,
      startTime: 0,
      startWall: Date.now(),
    })
  }
  return stores.get(videoId)!
}

function post(videoId: string, func: string, args: unknown[] = []) {
  const store = stores.get(videoId)
  store?.iframeRef.current?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }), '*'
  )
}

export default function YouTubeHero({ videoId }: Props) {
  const store = getStore(videoId)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  store.iframeRef = iframeRef

  useEffect(() => () => { stores.delete(videoId) }, [videoId])

  return (
    <iframe
      ref={iframeRef}
      src={BASE(videoId)}
      allow="autoplay; fullscreen"
      title="trailer"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ border: 'none', transform: 'scale(1.35)', transformOrigin: 'center center', filter: 'brightness(1.35) contrast(1.05)' }}
    />
  )
}

export function YouTubeHeroControls({ videoId }: Props) {
  const store = getStore(videoId)
  const [muted, setMuted] = useState(store.muted)
  const [playing, setPlaying] = useState(store.playing)

  const rerender = useCallback(() => {
    setMuted(store.muted)
    setPlaying(store.playing)
  }, [store])

  useEffect(() => {
    store.listeners.add(rerender)
    return () => { store.listeners.delete(rerender) }
  }, [store, rerender])

  function notify() { store.listeners.forEach((l) => l()) }

  function handleMute() {
    store.muted = !store.muted
    setTimeout(() => post(videoId, store.muted ? 'mute' : 'unMute'), 50)
    notify()
  }

  function handlePlay() {
    store.playing = !store.playing
    setTimeout(() => post(videoId, store.playing ? 'playVideo' : 'pauseVideo'), 50)
    if (store.playing) store.startWall = Date.now()
    notify()
  }

  function handleSeek(delta: number) {
    const elapsed = store.playing ? (Date.now() - store.startWall) / 1000 : 0
    const t = Math.max(0, store.startTime + elapsed + delta)
    store.startTime = t
    store.startWall = Date.now()
    setTimeout(() => post(videoId, 'seekTo', [t, true]), 50)
  }

  const btn = 'flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:brightness-125'
  const btnStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--separator)',
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => handleSeek(-10)} className={btn} style={btnStyle}>
        <SkipBack size={13} fill="currentColor" />
      </button>
      <button onClick={handlePlay} className={btn} style={btnStyle}>
        {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
      </button>
      <button onClick={() => handleSeek(10)} className={btn} style={btnStyle}>
        <SkipForward size={13} fill="currentColor" />
      </button>
      <button onClick={handleMute} className={btn} style={btnStyle}>
        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
      </button>
    </div>
  )
}
