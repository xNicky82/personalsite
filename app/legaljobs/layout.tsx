import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Legal Jobs — remote legal roles from across the web',
  description:
    'An aggregated, minimal directory of legal job postings — attorney, counsel, paralegal, and compliance roles — each with a title, short description, salary where listed, and a link back to the original posting.',
}

export default function LegalJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
