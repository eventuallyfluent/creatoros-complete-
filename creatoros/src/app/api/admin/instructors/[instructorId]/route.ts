import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function adminGuard(session: any) {
  return !!(session?.user?.role === 'ADMIN')
}

export async function PATCH(req: NextRequest, { params }: { params: { instructorId: string } }) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { displayName, slug, title, bio, profileImageUrl, bannerImageUrl, socialLinks, isPublic } = await req.json()

  if (slug) {
    const conflict = await prisma.instructorProfile.findFirst({
      where: { slug, NOT: { id: params.instructorId } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const instructor = await prisma.instructorProfile.update({
    where: { id: params.instructorId },
    data: {
      ...(displayName      !== undefined && { displayName }),
      ...(slug             !== undefined && { slug }),
      ...(title            !== undefined && { title:           title || null }),
      ...(bio              !== undefined && { bio:             bio || null }),
      ...(profileImageUrl  !== undefined && { profileImageUrl: profileImageUrl || null }),
      ...(bannerImageUrl   !== undefined && { bannerImageUrl:  bannerImageUrl  || null }),
      ...(socialLinks      !== undefined && { socialLinks }),
      ...(isPublic         !== undefined && { isPublic }),
    },
  })

  return NextResponse.json(instructor)
}

export async function DELETE(req: NextRequest, { params }: { params: { instructorId: string } }) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft-hide rather than delete — unlink from courses
  await prisma.instructorProfile.update({
    where: { id: params.instructorId },
    data:  { isPublic: false },
  })

  return NextResponse.json({ hidden: true })
}
