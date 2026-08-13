'use client'

import { useEffect, useState } from 'react'

// Where the board is embedded for sharing. The copy-link button hands out a URL
// on this host with ?job=<id>; the host's small embed script deep-links the
// iframe to that job (see the Webflow snippet).
const SHARE_BASE = 'https://spellbook.com/industryjobs'

export function ShareBar({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${SHARE_BASE}?job=${encodeURIComponent(id)}`

  // When shown inside the embed, tell the parent which job is open so it can
  // reflect it in the address bar (making the browser URL shareable too).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'legaljobs:job', id }, '*')
      } catch {}
    }
  }, [id])

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const t = document.createElement('textarea')
      t.value = shareUrl
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.focus()
      t.select()
      try {
        document.execCommand('copy')
      } catch {}
      t.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      {copied ? 'Link copied ✓' : 'Copy link'}
    </button>
  )
}
