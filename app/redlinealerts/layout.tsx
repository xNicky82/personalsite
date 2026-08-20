import type { Metadata } from 'next'
// Reuse Spellbook's brand typeface (Söhne), loaded once for /legaljobs.
import { sohne } from '../legaljobs/fonts'

export const metadata: Metadata = {
  title: 'Redline Alerts — live legal & contracts feed',
  description:
    'A live, Polymarket-style feed of short breaking alerts on law, contracts, litigation, and regulation — a demo of the Redline Alerts concept.',
}

export default function RedlineAlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={sohne.variable}>{children}</div>
}
