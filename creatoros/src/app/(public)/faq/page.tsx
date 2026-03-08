export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { DEFAULT_PAGES } from '@/lib/pages/default-pages'
import { extractBody } from '@/lib/pages/get-page'
import DynamicPage from '@/components/pages/DynamicPage'

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: 'faq' } })
  return { title: page?.metaTitle ?? 'FAQ — Perseus Arcane Academy' }
}

export default async function FaqPage() {
  const page = await prisma.page.findUnique({ where: { slug: 'faq' } })
  const def  = DEFAULT_PAGES.find(p => p.slug === 'faq')!
  return <DynamicPage title={page?.title ?? def.title} updatedAt={page?.updatedAt?.toISOString() ?? null} body={page ? extractBody(page) : def.body} />
}
