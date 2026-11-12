import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Local Doctor | Marketing dashboard',
  description: 'Internal marketing funnel dashboard.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2c63',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
