import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PageEditor from './PageEditor'

export const metadata: Metadata = { title: 'Edit Page — Admin' }

export default async function EditPagePage({ params }: { params: { pageId: string } }) {
  const page = params.pageId === 'new' ? null : await prisma.page.findUnique({ where: { id: params.pageId } })
  if (params.pageId !== 'new' && !page) notFound()

  // Extract body from blocks for editing
  const body = page
    ? ((page.blocks as any[])?.[0]?.data?.body ?? '')
    : ''

  return (
    <div style={{ padding: '32px' }}>
      <AdminPageHeader
        title={page ? page.title : 'New Page'}
        description={page ? `/${page.slug}` : 'Create a new page'}
        backHref="/admin/pages"
        backLabel="All Pages"
        action={page ? { label: 'View Page ↗', href: `/${page.slug}` } : undefined}
      />
      <PageEditor page={page ? { ...page, body } as any : null} />
    </div>
  )
}
