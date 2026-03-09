export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { createProductForCourse, createBundleProduct } from '@/lib/product/product-defaults'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await prisma.product.findMany({
    include: {
      instructor: { select: { displayName: true } },
      courses:    { include: { course: { select: { id: true, title: true, slug: true } } }, orderBy: { sortOrder: 'asc' } },
      _count:     { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { type } = body

  try {
    if (type === 'COURSE') {
      const { courseId, price, compareAtPrice, currency, instructorId, billingType, billingInterval, trialDays } = body
      if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 })

      const course = await prisma.course.findUnique({ where: { id: courseId } })
      if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

      // Check no product already exists for this course
      const existing = await prisma.productCourse.findFirst({ where: { courseId } })
      if (existing) {
        const existingProduct = await prisma.product.findUnique({ where: { id: existing.productId } })
        return NextResponse.json(
          { error: `This course already has a product: "${existingProduct?.title}". Edit that product instead.` },
          { status: 409 }
        )
      }

      const { productId } = await createProductForCourse(courseId, {
        title:          course.title,
        subtitle:       course.subtitle,
        slug:           course.slug,
        price:          price ?? 0,
        compareAtPrice: compareAtPrice ?? null,
        currency:       currency ?? 'USD',
        status:         'DRAFT',
        instructorId:   instructorId ?? null,
        thumbnailUrl:   course.thumbnailUrl ?? null,
        billingType:    billingType ?? 'ONE_TIME',
        billingInterval:billingInterval ?? null,
        trialDays:      trialDays ?? null,
      })

      // Sync instructorId back to Course if supplied
      if (instructorId) {
        await prisma.course.update({ where: { id: courseId }, data: { instructorId } })
      }

      const product = await prisma.product.findUnique({ where: { id: productId } })
      return NextResponse.json(product, { status: 201 })
    }

    if (type === 'BUNDLE') {
      const { title, slug, price, compareAtPrice, currency, courseIds, instructorId } = body

      if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
      if (!slug?.trim())  return NextResponse.json({ error: 'slug is required' }, { status: 400 })
      if (!courseIds?.length) return NextResponse.json({ error: 'Select at least one course' }, { status: 400 })

      // Slug uniqueness check
      const existing = await prisma.product.findUnique({ where: { slug } })
      if (existing) return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })

      const { productId } = await createBundleProduct({
        slug, title: title.trim(), price: price ?? 0,
        compareAtPrice: compareAtPrice ?? null,
        currency: currency ?? 'USD',
        courseIds, instructorId: instructorId ?? null,
      })

      const product = await prisma.product.findUnique({ where: { id: productId } })
      return NextResponse.json(product, { status: 201 })
    }

    return NextResponse.json({ error: 'type must be COURSE or BUNDLE' }, { status: 400 })

  } catch (err: any) {
    console.error('Product create error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
