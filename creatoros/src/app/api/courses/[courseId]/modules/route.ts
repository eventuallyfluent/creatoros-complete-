export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function adminOnly(session: any) {
  return session?.user?.role === 'ADMIN'
}

export async function POST(req: NextRequest, { params }: { params: { courseId: string } })  {
  try {

  const session = await getServerSession(authOptions)
  if (!adminOnly(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, sortOrder } = await req.json()

  const module = await prisma.module.create({
    data: {
      courseId:    params.courseId,
      title:       title || 'New Module',
      sortOrder:   sortOrder ?? 0,
      isPublished: true,
    },
  })

  return NextResponse.json(module, { status: 201 })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}