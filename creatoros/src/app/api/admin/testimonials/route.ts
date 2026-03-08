import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function guard(session: any) { return session?.user?.role === 'ADMIN' }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = req.nextUrl.searchParams.get('status') // PENDING | APPROVED | REJECTED | null=all
  const testimonials = await prisma.testimonial.findMany({
    where:   status ? { status: status as any } : undefined,
    include: {
      course: { select: { id: true, title: true, slug: true } },
      user:   { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(testimonials)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { authorName, authorRole, quote, courseId, status, isFeatured, publicUseConsent } = await req.json()
  if (!authorName?.trim()) return NextResponse.json({ error: 'Author name required' }, { status: 400 })
  if (!quote?.trim())      return NextResponse.json({ error: 'Quote required' }, { status: 400 })

  const t = await prisma.testimonial.create({
    data: {
      authorName,
      authorRole:       authorRole     || null,
      quote,
      courseId:         courseId       || null,
      status:           status         ?? 'APPROVED',
      isFeatured:       isFeatured     ?? false,
      publicUseConsent: publicUseConsent ?? true,
      consentDate:      publicUseConsent ? new Date() : null,
      source:           'ADMIN_ENTERED',
    },
  })
  return NextResponse.json(t, { status: 201 })
}
