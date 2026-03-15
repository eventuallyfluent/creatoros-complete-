import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { getSiteSettings } from '@/lib/settings/site-settings'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, settings] = await Promise.all([
    getServerSession(authOptions),
    getSiteSettings(),
  ])

  const logoDark  = (settings as any).logoDarkUrl  || settings.logoUrl || null
  const logoLight = (settings as any).logoLightUrl || settings.logoUrl || null

  return (
    <>
      <Navbar session={session} logoDarkUrl={logoDark} logoLightUrl={logoLight} />
      <main style={{ paddingTop: 'var(--nav-height)' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
