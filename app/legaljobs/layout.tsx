import type { Metadata } from 'next'
import { sohne } from './fonts'

export const metadata: Metadata = {
  title: 'Browse legal jobs in tech',
  description:
    'Legal roles — counsel, compliance, privacy, paralegal and more — pulled straight from the careers pages of top tech and AI companies, each linking back to the original posting.',
}

export default function LegalJobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={sohne.variable}>{children}</div>
}
