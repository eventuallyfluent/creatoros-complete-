'use client'
/**
 * VideoPlayer — CreatorOS universal video player
 *
 * Renders a consistent branded player shell regardless of video host.
 * The underlying video is always an iframe (required for domain-locked embeds).
 * For providers with a JS API (Vimeo, YouTube, Bunny), we layer our own
 * controls on top via postMessage. For providers without an API (Streamable,
 * Wistia, Loom, Custom), we render their native iframe full-size inside our
 * branded shell — controls come from the provider but the outer frame and
 * loading/error states are consistent.
 *
 * Provider support matrix:
 *  STREAMABLE   → iframe, native controls (no public API)
 *  VIMEO        → iframe, CreatorOS controls via Vimeo Player JS API (postMessage)
 *  YOUTUBE      → iframe, CreatorOS controls via YouTube IFrame API (postMessage)
 *  BUNNY        → iframe, CreatorOS controls via Bunny Stream API (postMessage)
 *  MUXASSET     → iframe via Mux player embed
 *  MUXPLAYBACK  → iframe via Mux playback URL
 *  WISTIA       → iframe, native controls
 *  LOOM         → iframe, native controls
 *  CUSTOM       → plain iframe, native controls (unknown provider)
 */

import {
  useState, useEffect, useRef, useCallback,
} from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Loader2, AlertCircle,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

export type VideoProvider =
  | 'STREAMABLE' | 'VIMEO' | 'YOUTUBE' | 'BUNNY'
  | 'MUXASSET' | 'MUXPLAYBACK' | 'WISTIA' | 'LOOM' | 'CUSTOM'

export interface VideoPlayerProps {
  provider:    VideoProvider
  videoId?:    string | null
  videoUrl?:   string | null  // raw embed URL — used as-is if set
  title?:      string
  /**
   * Aspect ratio as a padding-bottom percentage string.
   * e.g. "56.25" = 16:9 landscape (default)
   *      "75"    = 4:3
   *      "100"   = 1:1 square
   *      "150"   = 2:3 portrait (vertical)
   * Parsed automatically from Streamable embed codes on import.
   */
  aspectRatio?: string | null
  /** Called when the video is determined to have ended */
  onEnded?:    () => void
  /** Called periodically with 0–100 progress value */
  onProgress?: (pct: number) => void
  autoplay?:   boolean
}

// ── Providers with postMessage API support ───────────────────────────────────

const API_PROVIDERS: VideoProvider[] = ['VIMEO', 'YOUTUBE', 'BUNNY']

// ── Embed URL builder ────────────────────────────────────────────────────────

function buildEmbedUrl(
  provider: VideoProvider,
  videoId:  string | null | undefined,
  videoUrl: string | null | undefined,
): string | null {
  // Raw URL always wins
  if (videoUrl?.trim()) return videoUrl.trim()
  if (!videoId?.trim()) return null

  const id = videoId.trim()
  switch (provider) {
    case 'STREAMABLE':
      return `https://streamable.com/e/${id}`
    case 'VIMEO':
      // api=1 enables postMessage; transparent bg; no byline/portrait
      return `https://player.vimeo.com/video/${id}?api=1&background=0&byline=0&portrait=0&title=0`
    case 'YOUTUBE':
      // enablejsapi enables postMessage; rel=0 no related; modestbranding
      return `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1&color=white`
    case 'BUNNY': {
      // Bunny Stream embed: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
      // videoId format expected: "libraryId/videoId"
      const [lib, vid] = id.includes('/') ? id.split('/') : ['', id]
      return lib
        ? `https://iframe.mediadelivery.net/embed/${lib}/${vid}?autoplay=false&preload=true`
        : `https://iframe.mediadelivery.net/embed/${id}?autoplay=false&preload=true`
    }
    case 'MUXASSET':
      return `https://stream.mux.com/${id}.m3u8`  // handled via custom embed below
    case 'MUXPLAYBACK':
      return `https://stream.mux.com/${id}`
    case 'WISTIA':
      return `https://fast.wistia.net/embed/iframe/${id}?videoFoam=true`
    case 'LOOM':
      return `https://www.loom.com/embed/${id}`
    case 'CUSTOM':
      return id.startsWith('http') ? id : null
    default:
      return null
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasApiSupport(provider: VideoProvider) {
  return API_PROVIDERS.includes(provider)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function VideoPlayer({
  provider, videoId, videoUrl, title,
  aspectRatio,
  onEnded, onProgress, autoplay = false,
}: VideoPlayerProps) {
  const embedUrl = buildEmbedUrl(provider, videoId, videoUrl)

  // Resolved padding-bottom percentage — drives the responsive height trick
  // 56.25 = 16:9 (default), 75 = 4:3, 100 = square, 150 = 2:3 portrait
  const paddingBottom = `${parseFloat(aspectRatio ?? '56.25') || 56.25}%`

  // Player state (only meaningful for API-backed providers)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [playing,   setPlaying]   = useState(false)
  const [muted,     setMuted]     = useState(false)
  const [duration,  setDuration]  = useState(0)
  const [current,   setCurrent]   = useState(0)
  const [showCtrl,  setShowCtrl]  = useState(true)
  const [apiReady,  setApiReady]  = useState(false)

  const iframeRef  = useRef<HTMLIFrameElement>(null)
  const hideTimer  = useRef<ReturnType<typeof setTimeout>>()
  const pollTimer  = useRef<ReturnType<typeof setInterval>>()

  const progress = duration > 0 ? (current / duration) * 100 : 0

  // ── postMessage helpers ──────────────────────────────────────────────────

  const postToIframe = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), '*')
  }, [])

  const vimeoCmd = useCallback((method: string, value?: unknown) => {
    postToIframe(value !== undefined ? { method, value } : { method })
  }, [postToIframe])

  const ytCmd = useCallback((func: string, args?: unknown[]) => {
    postToIframe({ event: 'command', func, args: args ?? [] })
  }, [postToIframe])

  const bunnyCmd = useCallback((command: string) => {
    postToIframe({ command })
  }, [postToIframe])

  // ── Playback controls ────────────────────────────────────────────────────

  const togglePlay = useCallback(() => {
    if (!apiReady) return
    if (provider === 'VIMEO')   vimeoCmd(playing ? 'pause' : 'play')
    if (provider === 'YOUTUBE') ytCmd(playing ? 'pauseVideo' : 'playVideo')
    if (provider === 'BUNNY')   bunnyCmd(playing ? 'pause' : 'play')
  }, [apiReady, provider, playing, vimeoCmd, ytCmd, bunnyCmd])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    if (provider === 'VIMEO')   vimeoCmd(next ? 'setVolume' : 'setVolume', next ? 0 : 1)
    if (provider === 'YOUTUBE') ytCmd(next ? 'mute' : 'unMute')
    if (provider === 'BUNNY')   bunnyCmd(next ? 'mute' : 'unmute')
  }, [muted, provider, vimeoCmd, ytCmd, bunnyCmd])

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!apiReady || duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = (e.clientX - rect.left) / rect.width
    const secs = pct * duration
    if (provider === 'VIMEO')   vimeoCmd('setCurrentTime', secs)
    if (provider === 'YOUTUBE') ytCmd('seekTo', [secs, true])
    if (provider === 'BUNNY')   bunnyCmd(`seek:${secs}`)
    setCurrent(secs)
  }, [apiReady, duration, provider, vimeoCmd, ytCmd, bunnyCmd])

  const requestFullscreen = useCallback(() => {
    iframeRef.current?.requestFullscreen?.()
  }, [])

  // ── Controls visibility ──────────────────────────────────────────────────

  const showControls = useCallback(() => {
    setShowCtrl(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (playing) setShowCtrl(false) }, 2500)
  }, [playing])

  // ── Receive postMessage events ───────────────────────────────────────────

  useEffect(() => {
    const handle = (e: MessageEvent) => {
      // Ignore non-object / non-string messages
      let data: Record<string, unknown>
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch { return }

      // ── Vimeo ─────────────────────────────────────────────────────────
      if (provider === 'VIMEO') {
        if (data.event === 'ready') {
          setApiReady(true); setLoading(false)
          vimeoCmd('addEventListener', 'play')
          vimeoCmd('addEventListener', 'pause')
          vimeoCmd('addEventListener', 'ended')
          vimeoCmd('addEventListener', 'timeupdate')
          vimeoCmd('addEventListener', 'durationchange')
          if (autoplay) vimeoCmd('play')
        }
        if (data.event === 'play')     setPlaying(true)
        if (data.event === 'pause')    setPlaying(false)
        if (data.event === 'ended')    { setPlaying(false); onEnded?.() }
        if (data.event === 'durationchange') setDuration(Number(data.data?.duration) || 0)
        if (data.event === 'timeupdate') {
          const t = Number((data.data as any)?.seconds) || 0
          setCurrent(t)
          onProgress?.(duration > 0 ? (t / duration) * 100 : 0)
        }
      }

      // ── YouTube ───────────────────────────────────────────────────────
      if (provider === 'YOUTUBE') {
        if (data.event === 'onReady') {
          setApiReady(true); setLoading(false)
          if (autoplay) ytCmd('playVideo')
        }
        if (data.event === 'onStateChange') {
          const state = Number(data.info)
          if (state === 1) setPlaying(true)   // playing
          if (state === 2) setPlaying(false)  // paused
          if (state === 0) { setPlaying(false); onEnded?.() } // ended
        }
        // YouTube doesn't push timeupdate — poll instead
        if (data.event === 'infoDelivery' && (data.info as any)?.currentTime !== undefined) {
          const t   = Number((data.info as any).currentTime)
          const dur = Number((data.info as any).duration) || duration
          setCurrent(t)
          if (dur) setDuration(dur)
          onProgress?.(dur > 0 ? (t / dur) * 100 : 0)
        }
      }

      // ── Bunny ─────────────────────────────────────────────────────────
      if (provider === 'BUNNY') {
        if (data.event === 'ready')    { setApiReady(true); setLoading(false) }
        if (data.event === 'play')     setPlaying(true)
        if (data.event === 'pause')    setPlaying(false)
        if (data.event === 'ended')    { setPlaying(false); onEnded?.() }
        if (data.event === 'duration') setDuration(Number(data.duration) || 0)
        if (data.event === 'timeupdate') {
          const t = Number(data.currentTime) || 0
          setCurrent(t)
          onProgress?.(duration > 0 ? (t / duration) * 100 : 0)
        }
      }
    }

    window.addEventListener('message', handle)
    return () => window.removeEventListener('message', handle)
  }, [provider, duration, autoplay, vimeoCmd, ytCmd, onEnded, onProgress])

  // ── YouTube progress poll (YouTube doesn't push timeupdate reliably) ────
  useEffect(() => {
    if (provider !== 'YOUTUBE' || !apiReady) return
    pollTimer.current = setInterval(() => {
      ytCmd('getPlayerState')  // triggers infoDelivery with currentTime
    }, 1000)
    return () => clearInterval(pollTimer.current)
  }, [provider, apiReady, ytCmd])

  // ── Cleanup — clears all timers on unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      if (hideTimer.current)  clearTimeout(hideTimer.current)
      if (pollTimer.current)  clearInterval(pollTimer.current)
    }
  }, [])

  // ── Vimeo: ping iframe on load so it sends "ready" ──────────────────────
  const handleIframeLoad = useCallback(() => {
    if (provider === 'VIMEO') {
      // Vimeo sends ready automatically once postMessage channel opens
      setLoading(false)
    } else if (!hasApiSupport(provider)) {
      // Non-API providers: just clear loading on iframe load
      setLoading(false)
    }
  }, [provider])

  // ── Render: no URL ───────────────────────────────────────────────────────
  if (!embedUrl) {
    return (
      <div style={{ ...styles.outerShell, paddingBottom }}>
        <div style={styles.innerShell}>
          <div style={styles.errorState}>
            <AlertCircle size={40} color="#6b7280" />
            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '12px 0 0' }}>
              No video configured for this lesson.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const showApiControls = hasApiSupport(provider) && apiReady

  return (
    <div style={{ ...styles.outerShell, paddingBottom }}>
      <div
        style={styles.innerShell}
        onMouseMove={showControls}
        onMouseLeave={() => { if (playing) setShowCtrl(false) }}
      >
      {/* ── Loading overlay ── */}
      {loading && (
        <div style={styles.overlay}>
          <Loader2 size={36} color="white" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* ── Error overlay ── */}
      {error && (
        <div style={styles.overlay}>
          <AlertCircle size={36} color="#f87171" />
          <p style={{ color: '#fca5a5', fontSize: '14px', margin: '10px 0 0', textAlign: 'center', maxWidth: '320px' }}>
            {error}
          </p>
        </div>
      )}

      {/* ── The iframe ── */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        title={title ?? 'Video lesson'}
        onLoad={handleIframeLoad}
        onError={() => { setLoading(false); setError('Video failed to load. Please try refreshing.') }}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none',
          // For non-API providers show immediately; for API providers keep under our shell
          zIndex: 1,
        }}
      />

      {/* ── CreatorOS control bar (API providers only) ── */}
      {showApiControls && (
        <div
          style={{
            ...styles.controlBar,
            opacity: showCtrl || !playing ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          {/* Play/Pause */}
          <button onClick={togglePlay} style={styles.ctrlBtn} title={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={18} fill="white" color="white" /> : <Play size={18} fill="white" color="white" />}
          </button>

          {/* Time */}
          <span style={styles.timeLabel}>
            {formatTime(current)}
            {duration > 0 && <span style={{ opacity: 0.5 }}> / {formatTime(duration)}</span>}
          </span>

          {/* Seek bar */}
          <div
            style={styles.seekTrack}
            onClick={seek}
            title="Seek"
          >
            {/* Buffered / background */}
            <div style={{ ...styles.seekFill, width: '100%', background: 'rgba(255,255,255,0.15)' }} />
            {/* Played */}
            <div style={{ ...styles.seekFill, width: `${progress}%`, background: 'var(--brand, #7B2FBE)' }} />
            {/* Thumb */}
            <div style={{ ...styles.seekThumb, left: `${progress}%` }} />
          </div>

          {/* Mute */}
          <button onClick={toggleMute} style={styles.ctrlBtn} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX size={16} color="white" /> : <Volume2 size={16} color="white" />}
          </button>

          {/* Fullscreen */}
          <button onClick={requestFullscreen} style={styles.ctrlBtn} title="Fullscreen">
            <Maximize size={16} color="white" />
          </button>
        </div>
      )}

      {/* ── Big play button overlay for API providers when paused ── */}
      {showApiControls && !playing && !loading && (
        <button
          onClick={togglePlay}
          style={styles.bigPlayBtn}
          title="Play"
        >
          <Play size={32} fill="white" color="white" />
        </button>
      )}

      {/* Spin keyframes injected once */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      </div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  // Outer: width:100%, height:0, padding-bottom drives the aspect ratio responsively.
  // paddingBottom is set dynamically per-instance (e.g. "56.25%" for 16:9, "150%" for portrait).
  outerShell: {
    position: 'relative' as const,
    width:    '100%',
    height:   0,
    // paddingBottom applied inline per render
    background: '#0D0D1A',
    overflow:   'hidden',
  },
  // Inner: absolutely fills the outer, contains all overlays and the iframe.
  innerShell: {
    position: 'absolute' as const,
    inset:    0,
    width:    '100%',
    height:   '100%',
  },
  overlay: {
    position:       'absolute' as const,
    inset:          0,
    zIndex:         10,
    display:        'flex',
    flexDirection:  'column' as const,
    alignItems:     'center',
    justifyContent: 'center',
    background:     'rgba(13,13,26,0.7)',
  },
  errorState: {
    position:       'absolute' as const,
    inset:          0,
    display:        'flex',
    flexDirection:  'column' as const,
    alignItems:     'center',
    justifyContent: 'center',
  },
  controlBar: {
    position:   'absolute' as const,
    bottom:     0,
    left:       0,
    right:      0,
    zIndex:     20,
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    padding:    '10px 14px 12px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
  },
  ctrlBtn: {
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    '4px',
    display:    'flex',
    alignItems: 'center',
    flexShrink: 0 as const,
    opacity:    0.9,
  },
  timeLabel: {
    fontSize:   '12px',
    color:      'white',
    fontFamily: 'var(--font-ui, monospace)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0 as const,
    minWidth:   '80px',
  },
  seekTrack: {
    flex:         1,
    height:       '4px',
    position:     'relative' as const,
    cursor:       'pointer',
    borderRadius: '2px',
    overflow:     'visible',
  },
  seekFill: {
    position:     'absolute' as const,
    top:          0,
    left:         0,
    height:       '100%',
    borderRadius: '2px',
    pointerEvents:'none' as const,
  },
  seekThumb: {
    position:    'absolute' as const,
    top:         '50%',
    transform:   'translate(-50%, -50%)',
    width:       '12px',
    height:      '12px',
    borderRadius:'50%',
    background:  'white',
    boxShadow:   '0 1px 4px rgba(0,0,0,0.5)',
    pointerEvents:'none' as const,
    transition:  'left 0.1s',
  },
  bigPlayBtn: {
    position:       'absolute' as const,
    top:            '50%',
    left:           '50%',
    transform:      'translate(-50%, -50%)',
    zIndex:         15,
    background:     'rgba(0,0,0,0.55)',
    border:         '2px solid rgba(255,255,255,0.7)',
    borderRadius:   '50%',
    width:          '72px',
    height:         '72px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
    backdropFilter: 'blur(4px)',
    transition:     'transform 0.15s, background 0.15s',
  },
} as const
