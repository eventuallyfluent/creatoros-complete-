export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const term = q.toLowerCase()

  const [products, instructors, collections] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title:       { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { subtitle:    { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, slug: true, title: true, thumbnailUrl: true, price: true, currency: true, type: true,
                courses: { take: 1, include: { course: { select: { thumbnailUrl: true } } } } },
      take: 6,
    }),
    prisma.instructorProfile.findMany({
      where: {
        isPublic: true,
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { title:        { contains: q, mode: 'insensitive' } },
          { bio:          { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, slug: true, displayName: true, title: true, profileImageUrl: true },
      take: 3,
    }),
    prisma.collection.findMany({
      where: {
        isPublished: true,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { id: true, slug: true, name: true },
      take: 3,
    }),
  ])

  const results = [
    ...products.map(p => ({
      type:    'course' as const,
      id:      p.id,
      slug:    p.slug,
      title:   p.title,
      meta:    `${p.currency} ${Number(p.price).toFixed(2)}${p.type === 'BUNDLE' ? ' · Bundle' : ''}`,
      image:   p.thumbnailUrl ?? p.courses[0]?.course.thumbnailUrl ?? null,
      href:    `/courses/${p.slug}`,
    })),
    ...instructors.map(i => ({
      type:    'instructor' as const,
      id:      i.id,
      slug:    i.slug,
      title:   i.displayName,
      meta:    i.title ?? 'Instructor',
      image:   i.profileImageUrl ?? null,
      href:    `/instructors/${i.slug}`,
    })),
    ...collections.map(c => ({
      type:    'collection' as const,
      id:      c.id,
      slug:    c.slug,
      title:   c.name,
      meta:    'Collection',
      image:   null,
      href:    `/collection/${c.slug}`,
    })),
  ]

  return NextResponse.json({ results })
}
