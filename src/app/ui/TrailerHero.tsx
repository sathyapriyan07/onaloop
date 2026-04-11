import { useEffect, useRef, useState } from 'react'
import { pickImageUrl } from '../../lib/image'

const MI = ({ name }: { name: string }) => (
  <span className="material-icons-round" style={{ fontSize: 18, lineHeight: 1 }}>{name}</span>
)

type Props = {
  title: string
  trailerUrl?: string | null
  backdropUrl?: string | null
  backdropImages?: unknown
  logoUrl?: string | null
  titleLogos?: unknown
}

function extractYouTubeId(url: string) {
  const m = url.match(/[?&]v=([^&]+)/) ?? url.match(/youtu\.be\/([^?]+)/)
  return m?.[1] ?? null
}

export default function TrailerHero({ title, trailerUrl, backdropUrl, backdropImages, logoUrl, titleLogos }: Props) {
  const bg = pickImageUrl(backdropUrl, backdropImages, null)
  const logo = pickImageUrl(logoUrl, titleLogos, null)
  const videoId = trailerUrl ? extractYouTubeId(trailerUrl) : null

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [trailerActive, setTrailerActive] = useState(false)
  const [ready, setReady] = useState(false)

  // Listen for YT iframe API messages
  useEffect(() => {
    if (!videoId) return
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.event === 'onReady') {
          setReady(true)
          // autoplay muted
          send('mute')
          send('playVideo')
        }
        if (data?.event === 'onStateChange') {
          // 1 = playing, 2 = paused
          setPlaying(data.info === 1)
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [videoId])

  function send(func: string, args?: unknown[]) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: args ?? [] }),
      '*'
    )
  }

  function togglePlay() {
    if (playing) { send('pauseVideo'); setPlaying(false) }
    else { send('playVideo'); setPlaying(true) }
  }

  function toggleMute() {
    if (muted) { send('unMute'); setMuted(false) }
    else { send('mute'); setMuted(true) }
  }

  function skipBack() { skipRelative(-10) }
  function skipForward() { skipRelative(10) }

  // Track approximate current time ourselves
  const currentTimeRef = useRef(0)
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => { currentTimeRef.current += 0.25 }, 250)
    return () => clearInterval(interval)
  }, [playing])

  function skipRelative(delta: number) {
    const next = Math.max(0, currentTimeRef.current + delta)
    currentTimeRef.current = next
    send('seekTo', [next, true])
  }

  const showTrailer = trailerActive && videoId

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black">
      <div className="relative aspect-[16/9] w-full">

        {/* Backdrop image — shown when trailer not active */}
        {bg && !showTrailer ? (
          <img src={bg} alt={title} className="h-full w-full object-cover" />
        ) : null}

        {/* YouTube iframe — always mounted when videoId exists so it can preload */}
        {videoId ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&origin=${encodeURIComponent(window.location.origin)}`}
            allow="autoplay; fullscreen"
            allowFullScreen
            title={title}
            className={['absolute inset-0 h-full w-full transition-opacity duration-500', showTrailer ? 'opacity-100' : 'opacity-0 pointer-events-none'].join(' ')}
            style={{ border: 'none' }}
            onLoad={() => {
              // trigger ready check via postMessage
              setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                  JSON.stringify({ event: 'listening' }), '*'
                )
              }, 500)
            }}
          />
        ) : null}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

        {/* Logo / title */}
        <div className="absolute inset-x-0 bottom-14 p-4">
          {logo ? (
            <img src={logo} alt={title} className="max-h-14 w-auto max-w-[70%] object-contain drop-shadow-[0_12px_26px_rgba(0,0,0,0.7)]" />
          ) : (
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          )}
        </div>

        {/* Controls bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 pb-3">
          {videoId ? (
            <>
              {/* Play trailer / back to backdrop toggle */}
              <button
                onClick={() => { setTrailerActive((v) => !v); if (!trailerActive) { setPlaying(true) } }}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25 transition-colors"
              >
                <MI name={trailerActive ? 'close' : 'movie'} />
                {trailerActive ? 'Hide' : 'Trailer'}
              </button>

              {showTrailer && ready ? (
                <>
                  <button onClick={skipBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors">
                    <MI name="replay_10" />
                  </button>
                  <button onClick={togglePlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors">
                    <MI name={playing ? 'pause' : 'play_arrow'} />
                  </button>
                  <button onClick={skipForward} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors">
                    <MI name="forward_10" />
                  </button>
                  <button onClick={toggleMute} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors">
                    <MI name={muted ? 'volume_off' : 'volume_up'} />
                  </button>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
