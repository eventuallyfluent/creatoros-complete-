import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET()  {
  try {

  const testimonials = await prisma.testimonial.findMany({
    where:   { status: 'APPROVED', isFeatured: true },
    orderBy: { createdAt: 'desc' },
    select:  { id: true, authorName: true, authorRole: true, quote: true,
               course: { select: { title: true } } },
  })
  return NextResponse.json(testimonials)
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}