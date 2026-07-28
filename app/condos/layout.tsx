import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prelist — Toronto condos before they hit the market',
  description:
    'Browse off-market Toronto condos by estimated availability and register a pre-offer before the unit is ever listed.',
}

export default function CondosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
