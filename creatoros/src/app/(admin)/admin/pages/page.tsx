import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PagesClient from './PagesClient'

export const metadata: Metadata = { title: 'Pages — Admin' }

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title="Pages"
        description="Manage static pages — Privacy Policy, Terms, Contact, and any custom pages"
        action={{ label: '+ New Page', href: '/admin/pages/new' }}
      />
      <PagesClient pages={pages as any} />
    </div>
  )
}
