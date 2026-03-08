export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { extractBody } from '@/lib/pages/get-page'
import { DEFAULT_PAGES } from '@/lib/pages/default-pages'
import DynamicPage from '@/components/pages/DynamicPage'

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: 'gdpr' } })
  const def  = DEFAULT_PAGES.find(p => p.slug === 'gdpr')
  return { title: page?.metaTitle ?? def?.metaTitle ?? 'Perseus Arcane Academy' }
}

export default async function GdprPage() {
  const page = await prisma.page.findUnique({ where: { slug: 'gdpr' } })
  const def  = DEFAULT_PAGES.find(p => p.slug === 'gdpr')!
  return <DynamicPage title={page?.title ?? def.title} updatedAt={page?.updatedAt?.toISOString() ?? null} body={page ? extractBody(page) : def.body} />
}
