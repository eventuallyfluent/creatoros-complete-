import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import PortalSidebar from '@/components/portal/PortalSidebar'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/portal')

  const userId = (session.user as any)?.id
  // Only show Certificates tab if student has at least one cert-enabled enrolled course
  const hasCertificates = userId ? await prisma.enrollment.count({
    where: { userId, status: 'ACTIVE', course: { certificateEnabled: true } },
  }).then(n => n > 0).catch(() => false) : false

  return (
    <div className="portal-layout" data-theme="dark">
      <PortalSidebar session={session} hasCertificates={hasCertificates} />
      <main className="portal-main">{children}</main>
    </div>
  )
}
