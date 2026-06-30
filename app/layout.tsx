import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Header } from './header'
import { Footer } from './footer'
import { ThemeProvider } from 'next-themes'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nicholasrocha.com'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Nicholas Rocha — Growth Hacker',
    template: '%s | Nicholas Rocha',
  },
  description:
    'Personal site of Nicholas Rocha — Growth Hacker at Spellbook. Previously at Pine, Nordexa, and Tesla.',
  keywords: ['Nicholas Rocha', 'Growth Hacker', 'Spellbook', 'Pine', 'Growth'],
  authors: [{ name: 'Nicholas Rocha' }],
  openGraph: {
    type: 'website',
    url: 'https://nicholasrocha.com',
    title: 'Nicholas Rocha — Growth Hacker',
    description:
      'Personal site of Nicholas Rocha — Growth Hacker at Spellbook.',
    siteName: 'Nicholas Rocha',
    images: [
      {
        url: '/headshot.jpg',
        width: 1200,
        height: 1200,
        alt: 'Nicholas Rocha',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Nicholas Rocha — Growth Hacker',
    description:
      'Personal site of Nicholas Rocha — Growth Hacker at Spellbook.',
    images: ['/headshot.jpg'],
    creator: '@NicholasJRocha',
  },
}

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} bg-white tracking-tight antialiased dark:bg-zinc-950`}
      >
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
        >
          <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-inter-tight)]">
            <div className="relative mx-auto w-full max-w-screen-sm flex-1 px-4 pt-20">
              <Header />
              {children}
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
