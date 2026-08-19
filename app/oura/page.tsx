import { OuraApp } from './oura-app'

// Static, edge-cacheable. Submitting the email navigates to the Tally-hosted
// form as its own page, so no client-side embed script is needed here.
export default function OuraPage() {
  return <OuraApp />
}
