import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

type Props = {
  videoId: string
}

function buildSrc(videoId: string, muted: boolean) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&fs=0&enablejsapi=1`
}

export default function YouTubeHero({ videoId }: Props) {
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [src, setSrc] = useState(() => buildSrc(videoId, true))
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const readyRef = useRef(false)

  // Listen for YouTube player ready event
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        // YT sends {event:'onReady'} or {info:{...}} when ready
        if (data?.event === 'onReady' || data?.info !== undefined) {
          readyRef.current = true
        }
      } catch {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function post(func: string) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }), '*'
    )
  }

  function handleMute() {
    const next = !muted
    setMuted(next)
    // Swap src to reliably toggle mute — postMessage mute is unreliable on first load
    setSrc(buildSrc(videoId, next))
    // Restore play state after reload
    setPlaying(true)
  }

  function handlePlay() {
    const next = !playing
    setPlaying(next)
    // Give iframe a tick to be ready
    setTimeout(() => post(next ? 'playVideo' : 'pauseVideo'), 100)
  }

  const btnStyle = {
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        allow="autoplay; fullscreen"
        title="trailer"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ border: 'none', transform: 'scale(1.35)', transformOrigin: 'center center', filter: 'brightness(1.35) contrast(1.05)' }}
      />
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
        <button onClick={handlePlay}
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={btnStyle}>
          {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
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
