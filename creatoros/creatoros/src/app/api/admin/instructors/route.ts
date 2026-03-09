export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function adminGuard(session: any) {
  return !!(session?.user?.role === 'ADMIN')
}

export async function GET(req: NextRequest)  {

  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const instructors = await prisma.instructorProfile.findMany({
    include: { _count: { select: { products: true, courses: true } } },
    orderBy: { displayName: 'asc' },
  })
  return NextResponse.json(instructors)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { displayName, slug, title, bio, profileImageUrl, bannerImageUrl, socialLinks, isPublic } = await req.json()

  if (!displayName?.trim()) return NextResponse.json({ error: 'Display name required' }, { status: 400 })
  if (!slug?.trim())        return NextResponse.json({ error: 'Slug required' }, { status: 400 })

  const conflict = await prisma.instructorProfile.findUnique({ where: { slug } })
  if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })

  // Create a placeholder user account for the instructor if needed
  const email = `instructor-${slug}@perseus.internal`
  const user  = await prisma.user.upsert({
    where:  { email },
    create: { email, role: 'INSTRUCTOR', emailVerified: new Date() },
    update: {},
  })

  const instructor = await prisma.instructorProfile.create({
    data: {
      userId:          user.id,
      slug,
      displayName,
      title:           title        || null,
      bio:             bio          || null,
      profileImageUrl: profileImageUrl || null,
      bannerImageUrl:  bannerImageUrl  || null,
      socialLinks:     socialLinks  ?? {},
      isPublic:        isPublic     ?? true,
    },
  })

  return NextResponse.json(instructor, { status: 201 })
}