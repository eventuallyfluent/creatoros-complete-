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

  const logoDark  = settings.logoDarkUrl  || settings.logoUrl || null
  const logoLight = settings.logoLightUrl || settings.logoUrl || null
  const navLinks  = settings.headerNav?.length ? settings.headerNav : undefined

  return (
    <>
      <Navbar session={session} logoDarkUrl={logoDark} logoLightUrl={logoLight} navLinks={navLinks} />
      <main style={{ paddingTop: 'var(--nav-height)' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
