'use client'

import Image from 'next/image'
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

                {/* Single pill: the input fills the box and the Claim button
                    is nested inside it on the right, with a small inset. */}
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 focus-within:border-white/30 focus-within:bg-white/10">
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
                    className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-base text-white placeholder:text-white/40 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: ACCENT }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-base font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-70"
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

            {/* Right: product panel — the real Oura Ring 5 render (a
                transparent PNG) floating in a softly lit dark field. */}
            <div
              className="relative hidden overflow-hidden md:block"
              style={{
                background:
                  'radial-gradient(120% 90% at 62% 42%, #1b1f22 0%, #050607 72%)',
              }}
            >
              <Image
                src="/oura/rings.webp"
                alt="Six Oura Ring 5 smart rings arranged in a circle"
                fill
                sizes="(min-width: 768px) 50vw, 0px"
                className="object-contain p-10"
                priority
              />
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
