'use client'

import { useId, useRef, useState } from 'react'
import { ARIZONA_STACK } from './fonts'

// Spellbook brand orange, used for the primary CTA.
const ACCENT = '#F94E1D'

// The Tally form to open. Its styling and multi-page flow are configured in
// Tally; the website only collects the email and hands off to the hosted form.
const FORM_ID = 'lb8BOV'

export function OuraApp() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input = inputRef.current
    const value = email.trim()

    // Native email validation — required + type="email". Show the inline error
    // and the browser's own tooltip, and don't navigate on bad input.
    if (!input || !value || !input.checkValidity()) {
      setError(
        input?.validationMessage || 'Please enter a valid work email address.',
      )
      input?.reportValidity()
      return
    }

    setError('')
    setLoading(true)

    // Open the Tally form as its own page (not a modal). The email is passed
    // via the `email` query param, which populates the form's hidden `email`
    // field — prefilled but editable, and carried through every page of the
    // form into the final submission.
    window.location.href = `https://tally.so/r/${FORM_ID}?email=${encodeURIComponent(
      value,
    )}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0d0e] font-[family-name:var(--font-sohne)] text-white antialiased">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#111315] shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: copy + email capture */}
            <div className="flex flex-col justify-center gap-6 p-8 sm:p-12">
              <p className="text-sm font-medium text-white/50">
                For a limited time
              </p>

              <h1
                className="text-4xl leading-[1.05] font-medium tracking-tight sm:text-5xl"
                style={{ fontFamily: ARIZONA_STACK }}
              >
                Demo Spellbook, get an Oura Ring 5
                <span style={{ color: ACCENT }}>*</span>
              </h1>

              <p className="max-w-md text-lg leading-relaxed text-white/60">
                Because you deserve something back for all those late nights
                spent reviewing contracts.
              </p>

              <form
                id="tally-email-capture"
                onSubmit={handleSubmit}
                noValidate
                className="w-full"
              >
                <label htmlFor="work-email" className="sr-only">
                  What&rsquo;s your work email?
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    ref={inputRef}
                    id="work-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="What’s your work email?"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/10 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: ACCENT }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-7 py-4 text-base font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Opening&hellip;
                      </>
                    ) : (
                      <>
                        Claim <span aria-hidden>&rarr;</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <p
                    id={errorId}
                    role="alert"
                    className="mt-3 text-sm text-[#ff8a6b]"
                  >
                    {error}
                  </p>
                )}
              </form>

              <p className="text-xs leading-relaxed text-white/40">
                *Terms and condition apply. Offer valid for businesses only.
              </p>
            </div>

            {/* Right: product panel */}
            <div className="relative hidden items-center justify-center overflow-hidden bg-black md:flex">
              <RingCluster />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 animate-spin"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={3}
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
}

// A cluster of smart rings echoing the reference art — brushed-metal bands with
// tiny green sensor LEDs, floating in a dark field. Pure SVG so it stays crisp
// and weightless at any size, and never triggers a network request.
function RingCluster() {
  const rings = [
    { cx: 200, cy: 120, rx: 62, ry: 78, rot: -18, metal: 'silver' },
    { cx: 300, cy: 165, rx: 60, ry: 76, rot: 12, metal: 'graphite' },
    { cx: 322, cy: 268, rx: 61, ry: 77, rot: 30, metal: 'gold' },
    { cx: 238, cy: 320, rx: 60, ry: 76, rot: -8, metal: 'silver' },
    { cx: 138, cy: 288, rx: 61, ry: 77, rot: 22, metal: 'graphite' },
    { cx: 128, cy: 185, rx: 60, ry: 76, rot: -30, metal: 'silver' },
  ] as const

  return (
    <svg
      viewBox="0 0 440 440"
      className="h-full max-h-[520px] w-full"
      role="img"
      aria-label="A cluster of Oura smart rings"
    >
      <defs>
        <radialGradient id="ring-bg" cx="50%" cy="42%" r="70%">
          <stop offset="0%" stopColor="#1d2124" />
          <stop offset="100%" stopColor="#050607" />
        </radialGradient>
        <linearGradient id="metal-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e9edf1" />
          <stop offset="45%" stopColor="#8b939b" />
          <stop offset="70%" stopColor="#3a4045" />
          <stop offset="100%" stopColor="#c7cdd3" />
        </linearGradient>
        <linearGradient id="metal-graphite" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7178" />
          <stop offset="45%" stopColor="#2c3033" />
          <stop offset="72%" stopColor="#0c0e0f" />
          <stop offset="100%" stopColor="#565c62" />
        </linearGradient>
        <linearGradient id="metal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3dfae" />
          <stop offset="45%" stopColor="#b48a4e" />
          <stop offset="72%" stopColor="#5c421f" />
          <stop offset="100%" stopColor="#e6c483" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="440" height="440" fill="url(#ring-bg)" />

      {rings.map((r, i) => (
        <g key={i} transform={`rotate(${r.rot} ${r.cx} ${r.cy})`}>
          {/* band */}
          <ellipse
            cx={r.cx}
            cy={r.cy}
            rx={r.rx}
            ry={r.ry}
            fill="none"
            stroke={`url(#metal-${r.metal})`}
            strokeWidth={19}
          />
          {/* inner + outer edge definition */}
          <ellipse
            cx={r.cx}
            cy={r.cy}
            rx={r.rx - 9.5}
            ry={r.ry - 9.5}
            fill="none"
            stroke="#000"
            strokeOpacity={0.55}
            strokeWidth={1.5}
          />
          <ellipse
            cx={r.cx}
            cy={r.cy}
            rx={r.rx + 9.5}
            ry={r.ry + 9.5}
            fill="none"
            stroke="#000"
            strokeOpacity={0.35}
            strokeWidth={1.5}
          />
          {/* sensor LEDs on the inner face */}
          <circle cx={r.cx - 7} cy={r.cy + r.ry - 10} r={2.6} fill="#7Cf6b4" />
          <circle cx={r.cx + 6} cy={r.cy + r.ry - 10} r={2.6} fill="#65e0ff" />
        </g>
      ))}
    </svg>
  )
}
