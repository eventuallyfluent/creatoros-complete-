import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <>
      <Navbar session={session} />
      <main style={{ paddingTop: 'var(--nav-height)' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
