import Script from 'next/script'
import { OuraApp } from './oura-app'

// Static, edge-cacheable — the whole experience runs on the client once Tally's
// embed script is loaded.
export default function OuraPage() {
  return (
    <>
      {/* Load Tally's popup widget once for the whole page. `afterInteractive`
          runs it as soon as the page is interactive; the form's submit handler
          falls back to a redirect if the script hasn't defined window.Tally yet. */}
      <Script src="https://tally.so/widgets/embed.js" strategy="afterInteractive" />
      <OuraApp />
    </>
  )
}
