import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

type Props = { videoId: string }

const BASE = (id: string) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&fs=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`

export default function YouTubeHero({ videoId }: Props) {
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)

  function post(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*'
    )
  }

  // Mark player ready when YT sends back state messages
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onReady' || data?.info !== undefined) {
          readyRef.current = true
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function handleMute() {
    const next = !muted
    setMuted(next)
    setTimeout(() => post(next ? 'mute' : 'unMute'), 50)
  }

  function handlePlay() {
    const next = !playing
    setPlaying(next)
    setTimeout(() => post(next ? 'playVideo' : 'pauseVideo'), 50)
  }

  function seek(seconds: number) {
    // getCurrentTime isn't synchronous via postMessage, so we track time ourselves
    post('seekTo', [seconds, true])
  }

  // Track elapsed time locally so we can seek relative to current position
  const startTimeRef = useRef(0)
  const startWallRef = useRef(Date.now())

  useEffect(() => {
    if (!playing) return
    startWallRef.current = Date.now()
  }, [playing])

  function getCurrentApproxTime() {
    if (!playing) return startTimeRef.current
    return startTimeRef.current + (Date.now() - startWallRef.current) / 1000
  }

  function handleSeek(delta: number) {
    const t = Math.max(0, getCurrentApproxTime() + delta)
    startTimeRef.current = t
    startWallRef.current = Date.now()
    setTimeout(() => post('seekTo', [t, true]), 50)
  }

  const btnStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        src={BASE(videoId)}
        allow="autoplay; fullscreen"
        title="trailer"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ border: 'none', transform: 'scale(1.35)', transformOrigin: 'center center', filter: 'brightness(1.35) contrast(1.05)' }}
      />
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        <button onClick={() => handleSeek(-10)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={btnStyle}>
          <SkipBack size={13} fill="currentColor" />
        </button>
        <button onClick={handlePlay}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={btnStyle}>
          {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
        </button>
        <button onClick={() => handleSeek(10)}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={btnStyle}>
          <SkipForward size={13} fill="currentColor" />
        </button>
        <button onClick={handleMute}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={btnStyle}>
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>
    </>
  )
}
