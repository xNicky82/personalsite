import type { Metadata } from 'next'
import { sohne } from './fonts'

export const metadata: Metadata = {
  title: 'Demo Spellbook, get an Oura Ring 5',
  description:
    'For a limited time, book a Spellbook demo and claim an Oura Ring 5. Because you deserve something back for all those late nights spent reviewing contracts.',
  robots: { index: false, follow: false },
}

export default function OuraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={sohne.variable}>{children}</div>
}
