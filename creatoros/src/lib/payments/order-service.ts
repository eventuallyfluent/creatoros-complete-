import { prisma } from '@/lib/db/prisma'
import { sendPostPurchaseMagicLink } from '@/lib/email/magic-link'

// ============================================================
// ORDER SERVICE — Product-aware, gateway agnostic
// ============================================================

export interface CreateOrderInput {
  email:      string
  userId?:    string
  productIds: string[]   // Products being purchased (COURSE or BUNDLE)
  couponCode?: string
  gatewayId:  string
  ipAddress?: string
}

export interface OrderTotals {
  subtotal:       number
  discountAmount: number
  total:          number
  couponId?:      string
  currency:       string
}

// ── Calculate totals ──────────────────────────────────────────────────────────

export async function calculateOrderTotals(
  productIds: string[],
  couponCode?: string
): Promise<OrderTotals> {
  const products = await prisma.product.findMany({
    where:  { id: { in: productIds }, status: 'PUBLISHED' },
    select: { id: true, price: true, currency: true },
  })

  if (products.length === 0) throw new Error('No valid products found')

  const currency     = products[0].currency
  const subtotal     = products.reduce((sum, p) => sum + Number(p.price), 0)
  let discountAmount = 0
  let couponId: string | undefined

  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code:     couponCode.toUpperCase(),
        isActive: true,
        OR:  [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] }],
      },
    })

    if (coupon && coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new Error('This coupon has reached its usage limit.')
    }

    if (coupon) {
      if (coupon.minimumOrderAmount && subtotal < Number(coupon.minimumOrderAmount)) {
        throw new Error(`Minimum order amount is ${currency} ${coupon.minimumOrderAmount}`)
      }
      if (coupon.applicableProductIds.length > 0) {
        const applicable = productIds.some(id => coupon.applicableProductIds.includes(id))
        if (!applicable) throw new Error('Coupon not valid for these products')
      }
      if (coupon.type === 'PERCENTAGE')   discountAmount = subtotal * (Number(coupon.value) / 100)
      else if (coupon.type === 'FIXED_AMOUNT') discountAmount = Math.min(Number(coupon.value), subtotal)
      else if (coupon.type === 'FREE')    discountAmount = subtotal
      couponId = coupon.id
    }
  }

  return { subtotal, discountAmount, total: Math.max(0, subtotal - discountAmount), couponId, currency }
}

// ── Create pending order ──────────────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput) {
  const { subtotal, discountAmount, total, couponId, currency } =
    await calculateOrderTotals(input.productIds, input.couponCode)

  const products = await prisma.product.findMany({
    where:  { id: { in: input.productIds } },
    select: { id: true, price: true },
  })
  const priceMap = new Map(products.map(p => [p.id, Number(p.price)]))

  const order = await prisma.order.create({
    data: {
      email:         input.email,
      userId:        input.userId,
      status:        'PENDING',
      subtotal,
      discountAmount,
      total,
      currency,
      couponId,
      gatewayId:     input.gatewayId,
      ipAddress:     input.ipAddress,
      items: {
        create: input.productIds.map(productId => ({
          productId,
          priceAtPurchase: priceMap.get(productId) ?? 0,
          itemType: 'MAIN',
        })),
      },
    },
    include: { items: true },
  })

  return order
}

// ── Fulfil a paid order ───────────────────────────────────────────────────────
// For each ordered Product:
//   COURSE  → enrol student in the one Course
//   BUNDLE  → enrol student in every Course in the Bundle

export async function fulfilOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              courses: { include: { course: true } },
            },
          },
        },
      },
      user: true,
    },
  })

  if (!order)                   throw new Error('Order not found')
  if (order.status !== 'PAID')  throw new Error('Order is not paid')

  // Get or create user
  let user = order.user
  if (!user && order.email) {
    user = await prisma.user.upsert({
      where:  { email: order.email },
      create: { email: order.email, role: 'STUDENT', emailVerified: new Date() },
      update: {},
    })
    await prisma.order.update({ where: { id: orderId }, data: { userId: user.id } })
  }
  if (!user) throw new Error('Could not create user account')

  const enrolledCourseIds: string[] = []

  for (const item of order.items) {
    const product = item.product
    const coursesToEnrol = product.courses.map(pc => pc.course)

    for (const course of coursesToEnrol) {
      await prisma.enrollment.upsert({
        where:  { userId_courseId: { userId: user.id, courseId: course.id } },
        create: {
          userId:    user.id,
          courseId:  course.id,
          productId: product.id,
          orderId:   order.id,
          status:    'ACTIVE',
        },
        update: { status: 'ACTIVE', productId: product.id },
      })
      enrolledCourseIds.push(course.id)
    }
  }

  // Increment coupon
  if (order.couponId) {
    await prisma.coupon.update({
      where: { id: order.couponId },
      data:  { usedCount: { increment: 1 } },
    })
  }

  // Send magic link to first enrolled course
  const firstProduct = order.items[0]?.product
  const firstCourse  = firstProduct?.courses[0]?.course
  if (firstCourse) {
    await sendPostPurchaseMagicLink({
      email:      order.email,
      courseName: firstProduct.type === 'BUNDLE' ? firstProduct.title : firstCourse.title,
      courseSlug: firstCourse.slug,
      orderId:    order.id,
    })
  }

  // Fire automations — product-level first, then per-course
  const { runAutomations } = await import('@/lib/automations/automation-engine')

  for (const item of order.items) {
    await runAutomations('PURCHASE', {
      userId: user.id, email: user.email,
      productId: item.productId, orderId: order.id,
    })
  }

  for (const item of order.items) {
    for (const pc of item.product.courses) {
      const ctx = {
        userId: user.id, email: user.email,
        productId: item.productId, courseId: pc.courseId, orderId: order.id,
      }
      await runAutomations('ENROLLMENT',     ctx)
      await runAutomations('ACCESS_GRANTED', ctx)
    }
  }

  return { userId: user.id, enrolledCourseIds }
}

// ── Mark order paid ───────────────────────────────────────────────────────────

export async function markOrderPaid(
  orderId:          string,
  gatewayOrderId:   string,
  gatewayPaymentId: string
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data:  { status: 'PAID', gatewayOrderId, gatewayPaymentId, paidAt: new Date() },
  })
  await fulfilOrder(order.id)
  return order
}

// ── Refund order ──────────────────────────────────────────────────────────────

export async function refundOrder(orderId: string, amount: number, isPartial: boolean) {
  await prisma.order.update({
    where: { id: orderId },
    data:  { status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED', refundedAt: new Date() },
  })

  if (!isPartial) {
    const order = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { items: { include: { product: { include: { courses: true } } } } },
    })
    if (order) {
      for (const item of order.items) {
        for (const pc of item.product.courses) {
          await prisma.enrollment.updateMany({
            where: { orderId, courseId: pc.courseId },
            data:  { status: 'REFUNDED' },
          })
        }
      }
    }
  }
}
