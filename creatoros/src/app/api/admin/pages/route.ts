export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

function guard(s: any) { return s?.user?.role === 'ADMIN' }

export async function GET(req: NextRequest)  {
  try {

  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const pages = await prisma.page.findMany({ orderBy: { updatedAt: 'desc' } })
  return NextResponse.json(pages)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!guard(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug, title, body, metaTitle, metaDescription, status } = await req.json()
  if (!slug?.trim())  return NextResponse.json({ error: 'Slug required' },  { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const conflict = await prisma.page.findUnique({ where: { slug } })
  if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })

  const page = await prisma.page.create({
    data: {
      slug, title,
      blocks:          body ? [{ id: '1', type: 'TEXT', data: { body }, order: 0 }] : [],
      metaTitle:       metaTitle       || null,
      metaDescription: metaDescription || null,
      status:          status          ?? 'DRAFT',
      type:            'STATIC',
    },
  })
  return NextResponse.json(page, { status: 201 })
}  } catch (error: any) {
    console.error('Route error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}