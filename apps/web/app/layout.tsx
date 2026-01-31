import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ClipSync — Your Clipboard, Everywhere',
  description:
    'Never lose what you copy. Sync your clipboard across all devices instantly. Secure, fast, and beautifully simple.',
  keywords: ['clipboard', 'sync', 'productivity', 'cross-platform', 'cloud clipboard'],
  authors: [{ name: 'ClipSync' }],
  openGraph: {
    title: 'ClipSync — Your Clipboard, Everywhere',
    description: 'Never lose what you copy. Sync your clipboard across all devices instantly.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClipSync — Your Clipboard, Everywhere',
    description: 'Never lose what you copy. Sync your clipboard across all devices instantly.',
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
