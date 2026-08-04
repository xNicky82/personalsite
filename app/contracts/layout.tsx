import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:
    'EDGAR Contracts — a sample agreement from the 50 largest U.S. public companies',
  description:
    'The top 50 U.S. public companies by revenue, each with a real, recently filed contract pulled from SEC EDGAR — a ready-made set of example agreements for contract review.',
}

export default function ContractsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
