export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AutomationBuilder from '@/components/admin/AutomationBuilder'

export const metadata: Metadata = { title: 'Edit Automation — Admin' }

export default async function EditAutomationPage({ params }: { params: { automationId: string } }) {
  const [automation, courses, products] = await Promise.all([
    prisma.automation.findUnique({
      where:   { id: params.automationId },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.course.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.product.findMany({ where: { status: { not: 'ARCHIVED' } }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
  ])
  if (!automation) notFound()

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title={automation.name} backHref="/admin/automations" backLabel="Automations" />
      <AutomationBuilder automation={automation as any} courses={courses} products={products} />
    </div>
  )
}
