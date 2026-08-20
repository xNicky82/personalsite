'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  type Alert,
  type Source,
  ACCENT,
  CATEGORY_STYLE,
  timeAgo,
} from './data'

// How many alerts are shown on first paint (server-rendered). The rest of the
// pool is held back and "dripped" in on a lively cadence to recreate the
// Polymarket "JUST IN" feel of a wire that never stops.
const INITIAL_VISIBLE = 7
// Cap the on-screen list so a long-running tab doesn't grow unbounded.
const MAX_VISIBLE = 60
// Drip cadence bounds (ms) — a new alert surfaces every few seconds.
const DRIP_MIN = 2600
const DRIP_MAX = 6500
// How often the client re-polls the JSON feed for genuinely new items.
const POLL_MS = 45_000
// How long a freshly-arrived card keeps its highlight.
const FLASH_MS = 1400

export function RedlineAlertsApp({
  initialAlerts,
  source: initialSource,
}: {
  initialAlerts: Alert[]
  source: Source
}) {
  const [visible, setVisible] = useState<Alert[]>(() =>
    initialAlerts.slice(0, INITIAL_VISIBLE),
  )
  const [source, setSource] = useState<Source>(initialSource)
  const [flash, setFlash] = useState<Set<string>>(new Set())
  const [now, setNow] = useState(0) // client clock (ms); 0 until mounted
  const [mounted, setMounted] = useState(false)
  const [embed, setEmbed] = useState(false)
  const [live, setLive] = useState(true) // whether new items are still arriving

  // Buffer of not-yet-shown alerts, plus every id we've ever surfaced (for
  // de-duping poll results). Kept in refs so topping them up never forces a
  // re-render on its own.
  const queueRef = useRef<Alert[]>(initialAlerts.slice(INITIAL_VISIBLE))
  const seenRef = useRef<Set<string>>(
    new Set(initialAlerts.map((a) => a.id)),
  )

  // `?embed=1` hides the top nav so the feed can be dropped into another site
  // (e.g. a Webflow iframe). Read on the client so this route stays static.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setEmbed(p.get('embed') === '1' || p.get('embed') === 'true')
  }, [])

  // Take over the clock after mount and tick every second so relative
  // timestamps stay live. Rendering times only once `mounted` avoids any
  // server/client hydration mismatch.
  useEffect(() => {
    setMounted(true)
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // The drip: surface the next queued alert on a jittered cadence. A
  // self-scheduling timeout (rather than a fixed interval) lets the gap between
  // alerts vary, which reads as a real wire rather than a metronome.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const q = queueRef.current
      if (q.length > 0) {
        const next = q.shift() as Alert
        setLive(true)
        setVisible((prev) => [next, ...prev].slice(0, MAX_VISIBLE))
        setFlash((prev) => new Set(prev).add(next.id))
        setTimeout(() => {
          setFlash((prev) => {
            const s = new Set(prev)
            s.delete(next.id)
            return s
          })
        }, FLASH_MS)
        const gap = DRIP_MIN + Math.random() * (DRIP_MAX - DRIP_MIN)
        timer = setTimeout(tick, gap)
      } else {
        // Caught up — settle into a "watching the wire" state and check back
        // shortly in case a poll has topped the queue up.
        setLive(false)
        timer = setTimeout(tick, 2500)
      }
    }
    timer = setTimeout(tick, 1200)
    return () => clearTimeout(timer)
  }, [])

  // Poll the JSON feed for genuinely new items and enqueue them (newest first)
  // so they drip in like everything else. Silent on failure — the feed just
  // keeps showing what it has.
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const res = await fetch('/redlinealerts/feed', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { alerts: Alert[]; source: Source }
        if (cancelled || !Array.isArray(data.alerts)) return
        if (data.source) setSource(data.source)
        const fresh = data.alerts.filter((a) => !seenRef.current.has(a.id))
        if (fresh.length) {
          fresh.forEach((a) => seenRef.current.add(a.id))
          // Newest first, ahead of whatever's already queued.
          queueRef.current = [...fresh, ...queueRef.current]
        }
      } catch {
        /* ignore — keep showing the current feed */
      }
    }
    const t = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const queued = queueRef.current.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black font-[family-name:var(--font-sohne)] text-white antialiased">
      {/* top nav — hidden when embedded via ?embed=1 */}
      {!embed && (
        <nav className="sticky top-0 z-10 border-b border-white/10 bg-black/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
            <a href="/" className="text-lg font-semibold tracking-tight">
              Redline Alerts<span style={{ color: ACCENT }}>.</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <LiveBadge live={live} />
              <a
                href="/"
                className="rounded-md border border-white/20 px-3 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
              >
                Portfolio
              </a>
            </div>
          </div>
        </nav>
      )}

      <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-24">
        {/* headline */}
        <header className="mb-8">
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Legal news, <span style={{ color: ACCENT }}>the moment</span> it
            breaks
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-white/60">
            <span>A live feed powered by</span>
            <RedlineLogo />
          </div>
        </header>

        {source === 'sample' && (
          <p className="mb-6 rounded-lg border border-dashed border-white/20 px-4 py-3 text-xs leading-relaxed text-white/60">
            Live news feeds weren’t reachable from this environment, so these are
            representative sample alerts. Real headlines stream in automatically
            once a source responds (they do in production).
          </p>
        )}

        {/* feed */}
        <div className="border-t border-white/10 pt-6">
          <ul className="space-y-2.5">
            <AnimatePresence initial={false}>
              {visible.map((a) => (
                <AlertCard
                  key={a.id}
                  alert={a}
                  now={now}
                  mounted={mounted}
                  flash={flash.has(a.id)}
                />
              ))}
            </AnimatePresence>
          </ul>

          {/* listening indicator at the tail of the feed */}
          <div className="mt-6 flex items-center gap-2.5 text-xs text-white/40">
            <span className="relative flex h-2 w-2">
              {live && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: ACCENT }}
                />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: live ? ACCENT : '#3f3f46' }}
              />
            </span>
            <span>
              {live
                ? 'Live — scanning the wire for new alerts'
                : 'Caught up — watching for the next alert'}
              {queued > 0 ? ` · ${queued} queued` : ''}
            </span>
          </div>
        </div>

        <footer className="mt-16 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/40">
          Alerts are aggregated from public news feeds, condensed to a short
          headline, and linked back to the original story. Headlines are the
          responsibility of the originating publisher. This is a demonstration
          and not legal advice.
        </footer>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function AlertCard({
  alert,
  now,
  mounted,
  flash,
}: {
  alert: Alert
  now: number
  mounted: boolean
  flash: boolean
}) {
  const cat = CATEGORY_STYLE[alert.category]
  const ago = mounted ? timeAgo(alert.publishedAt, now) : ''
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      className="overflow-hidden rounded-xl border transition-colors"
      style={{
        borderColor: flash ? ACCENT : 'rgba(255,255,255,0.1)',
        backgroundColor: flash ? 'rgba(255,71,22,0.06)' : 'transparent',
      }}
    >
      <a
        href={alert.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-white/5"
      >
        {/* category dot */}
        <span
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: cat.dot }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-wide uppercase">
            <span className="font-semibold" style={{ color: ACCENT }}>
              Just in
            </span>
            <span className="text-white/40">·</span>
            <span className="font-medium text-white/70">{cat.label}</span>
          </div>
          <p className="text-[15px] leading-snug font-medium text-white">
            {alert.headline}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/40">
            <span>{alert.source}</span>
            {ago && (
              <>
                <span className="text-white/25">·</span>
                <span className="tabular-nums">{ago} ago</span>
              </>
            )}
          </div>
        </div>
      </a>
    </motion.li>
  )
}

// The animated LIVE / IDLE pill in the nav.
function LiveBadge({ live }: { live: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
      <span className="relative flex h-2 w-2">
        {live && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: ACCENT }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: live ? ACCENT : '#52525b' }}
        />
      </span>
      <span style={{ color: live ? ACCENT : '#a1a1aa' }}>
        {live ? 'Live' : 'Idle'}
      </span>
    </span>
  )
}

// "The Redline" wordmark — white text with the brand accent struck through it,
// matching the /legaljobs treatment.
function RedlineLogo() {
  return (
    <span className="relative inline-block font-semibold whitespace-nowrap text-white">
      The Redline
      <span
        aria-hidden
        style={{ backgroundColor: ACCENT }}
        className="absolute top-1/2 right-[-0.12em] left-[-0.12em] h-[2px] -translate-y-1/2"
      />
    </span>
  )
}
