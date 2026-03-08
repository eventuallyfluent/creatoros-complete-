export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
)  {
  try {

  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { title, sortOrder, isPublished } = body

  const module = await prisma.module.update({
    where: { id: params.moduleId },
    data: {
      ...(title       !== undefined && { title }),
      ...(sortOrder   !== undefined && { sortOrder }),
      ...(isPublished !== undefined && { isPublished }),
    },
  })

  return NextResponse.json(module)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.module.delete({ where: { id: params.moduleId } })
  return NextResponse.json({ deleted: true })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}