import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import BroadcastComposer from './BroadcastComposer'

export const metadata: Metadata = { title: 'New Broadcast — Admin' }

export default async function NewBroadcastPage() {
  const [subscriberCount, courses] = await Promise.all([
    prisma.emailSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
    prisma.course.findMany({
      where:   { status: 'PUBLISHED' },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader title="New Broadcast" backHref="/admin/emails" backLabel="Email Log" />
      <BroadcastComposer subscriberCount={subscriberCount} courses={courses} />
    </div>
  )
}
