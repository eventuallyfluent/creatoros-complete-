import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-options'
import PortalSidebar from '@/components/portal/PortalSidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/portal')
  return (
    <div className="portal-layout" data-theme="dark">
      <PortalSidebar session={session} />
      <main className="portal-main">{children}</main>
    </div>
  )
}
