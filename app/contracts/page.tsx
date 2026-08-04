import { COMPANIES, FEATURED } from './data'
import { ContractsApp } from './contracts-app'

export default function ContractsPage() {
  return <ContractsApp companies={COMPANIES} featured={FEATURED} />
}
