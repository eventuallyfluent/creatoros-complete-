import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'

interface Params { params: { productId: string } }

export async function GET(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const product = await prisma.product.findUnique({
    where:   { id: params.productId },
    include: {
      instructor:    true,
      courses:       { include: { course: true }, orderBy: { sortOrder: 'asc' } },
      checkoutPages: { orderBy: { isDefault: 'desc' } },
      salesPage:     true,
    },
  })

  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    title, subtitle, status, price, compareAtPrice,
    currency, affiliateEnabled, instructorId,
  } = body

  try {
    const product = await prisma.product.update({
      where: { id: params.productId },
      data: {
        title:           title?.trim(),
        subtitle:        subtitle ?? null,
        status:          status,
        price:           price !== undefined ? price : undefined,
        compareAtPrice:  compareAtPrice !== undefined ? compareAtPrice : undefined,
        currency:        currency,
        affiliateEnabled:affiliateEnabled !== undefined ? affiliateEnabled : undefined,
        instructorId:    instructorId !== undefined ? instructorId : undefined,
      },
    })
    return NextResponse.json(product)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Cascade: SalesPage, Prompts, CheckoutPages, ProductCourse all deleted via onDelete: Cascade
    await prisma.product.delete({ where: { id: params.productId } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
