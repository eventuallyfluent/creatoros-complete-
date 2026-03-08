import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function guard(session: any) { return session?.user?.role === 'ADMIN' }

export async function PATCH(req: NextRequest, { params }: { params: { testimonialId: string } }) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await req.json()
  const t = await prisma.testimonial.update({
    where: { id: params.testimonialId },
    data:  {
      ...(data.status           !== undefined && { status:           data.status }),
      ...(data.isFeatured       !== undefined && { isFeatured:       data.isFeatured }),
      ...(data.publicUseConsent !== undefined && {
        publicUseConsent: data.publicUseConsent,
        consentDate:      data.publicUseConsent ? new Date() : null,
      }),
      ...(data.authorName  !== undefined && { authorName:  data.authorName }),
      ...(data.authorRole  !== undefined && { authorRole:  data.authorRole || null }),
      ...(data.quote       !== undefined && { quote:       data.quote }),
    },
  })
  return NextResponse.json(t)
}

export async function DELETE(req: NextRequest, { params }: { params: { testimonialId: string } }) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.testimonial.delete({ where: { id: params.testimonialId } })
  return NextResponse.json({ deleted: true })
}
