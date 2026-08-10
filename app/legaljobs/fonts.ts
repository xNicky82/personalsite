import localFont from 'next/font/local'

// Söhne (Klim Type Foundry) — Spellbook's brand typeface. Loaded locally and
// exposed as the CSS variable --font-sohne, applied to the /legaljobs page.
export const sohne = localFont({
  src: [
    { path: './fonts/SohneLeicht.otf', weight: '300', style: 'normal' },
    { path: './fonts/SohneBuch.otf', weight: '400', style: 'normal' },
    { path: './fonts/SohneKraftig.otf', weight: '600', style: 'normal' },
  ],
  variable: '--font-sohne',
  display: 'swap',
})
