import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}
import { getServerSession } from 'next-auth'
import { getSiteSettings } from '@/lib/settings/site-settings'
import { authOptions } from '@/lib/auth/auth-options'
import SessionProvider from '@/components/layout/SessionProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Perseus Arcane Academy',
    template: '%s — Perseus Arcane Academy',
  },
  description: 'Ancient wisdom for the modern initiate. Structured courses in Hermetics, esoteric traditions, and martial arts.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type:     'website',
    siteName: 'Perseus Arcane Academy',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, settings] = await Promise.all([
    getServerSession(authOptions),
    getSiteSettings(),
  ])
  const theme = (settings as any).themeVariant ?? 'dark'

  return (
    <html lang="en" suppressHydrationWarning data-theme={theme === 'light' ? 'light' : undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
