export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { extractBody } from '@/lib/pages/get-page'
import { DEFAULT_PAGES } from '@/lib/pages/default-pages'
import DynamicPage from '@/components/pages/DynamicPage'

export async function generateMetadata(): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: 'privacy' } })
  const def  = DEFAULT_PAGES.find(p => p.slug === 'privacy')
  return {
    title:       page?.metaTitle       ?? def?.metaTitle       ?? 'Privacy Policy — Perseus Arcane Academy',
    description: page?.metaDescription ?? undefined,
  }
}

export default async function PrivacyPage() {
  const page = await prisma.page.findUnique({ where: { slug: 'privacy' } })
  const def  = DEFAULT_PAGES.find(p => p.slug === 'privacy')!

  // Use DB content if it exists, otherwise show the hardcoded default
  const title     = page?.title    ?? def.title
  const body      = page ? extractBody(page) : def.body
  const updatedAt = page?.updatedAt?.toISOString() ?? null

  return <DynamicPage title={title} updatedAt={updatedAt} body={body} />
}
