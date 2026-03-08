import { prisma } from '@/lib/db/prisma'

export async function getPageBySlug(slug: string) {
  return prisma.page.findUnique({ where: { slug } })
}

export function extractBody(page: any): string {
  if (!page) return ''
  const blocks = (page.blocks ?? []) as any[]
  return blocks[0]?.data?.body ?? ''
}
