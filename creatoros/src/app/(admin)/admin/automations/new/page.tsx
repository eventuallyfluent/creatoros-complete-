export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AutomationBuilder from '@/components/admin/AutomationBuilder'

export const metadata: Metadata = { title: 'New Automation — Admin' }

export default async function NewAutomationPage() {
  const [courses, products] = await Promise.all([
    prisma.course.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.product.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])
  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="New Automation" backHref="/admin/automations" backLabel="Automations" />
      <AutomationBuilder courses={courses} products={products} />
    </div>
  )
}
