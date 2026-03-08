import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { createCourseDefaults } from '@/lib/course/course-defaults'

function adminGuard(session: any) {
  return !!(session && session.user?.role === 'ADMIN')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!adminGuard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, subtitle, slug, description, thumbnailUrl, status,
          instructorId, certificateEnabled, metaTitle, metaDescription } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!slug?.trim())  return NextResponse.json({ error: 'Slug is required' },  { status: 400 })

  const existing = await prisma.course.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })

  const course = await prisma.course.create({
    data: {
      title,
      subtitle:           subtitle        || null,
      slug,
      description:        description     || null,
      thumbnailUrl:       thumbnailUrl    || null,
      status:             status          || 'DRAFT',
      instructorId:       instructorId    || null,
      certificateEnabled: certificateEnabled ?? false,
      metaTitle:          metaTitle       || null,
      metaDescription:    metaDescription || null,
    },
  })

  // Auto-create defaults — a Product will be created separately via /admin/products
  await createCourseDefaults(course.id, course.title)

  return NextResponse.json(course, { status: 201 })
}
