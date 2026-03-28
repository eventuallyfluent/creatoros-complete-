export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { createOrder } from '@/lib/payments/order-service'
import { getGatewayDriver } from '@/lib/payments/gateway-registry'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId  = (session?.user as any)?.id ?? null

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, name, productIds, couponCode, gatewayId, gdprConsent } = body

  if (!email || !productIds?.length || !gatewayId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined

  // Validate products are published
  const products = await prisma.product.findMany({
    where:  { id: { in: productIds }, status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true, price: true },
  })

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products not available' }, { status: 400 })
  }

  let order
  try {
    order = await createOrder({ email, userId, productIds, couponCode, gatewayId, ipAddress: ip })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // GDPR optin
  if (gdprConsent && email) {
    await prisma.emailSubscriber.upsert({
      where:  { email },
      create: { email, userId, source: 'CHECKOUT', gdprConsent: true, gdprConsentAt: new Date(), gdprConsentIp: ip, status: 'SUBSCRIBED' },
      update: { gdprConsent: true, gdprConsentAt: new Date(), gdprConsentIp: ip, status: 'SUBSCRIBED' },
    })
  }

  // 100% coupon — fulfil immediately, no gateway needed
  if (Number(order.total) === 0) {
    const { markOrderPaid } = await import('@/lib/payments/order-service')
    await markOrderPaid(order.id, 'coupon_free', 'coupon_free')
    return NextResponse.json({
      orderId:     order.id,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${order.id}`,
    })
  }

  const driver = await getGatewayDriver(gatewayId)
  if (!driver) return NextResponse.json({ error: 'Payment method unavailable' }, { status: 500 })

  // Primary product is always the first in productIds (index 0), not DB sort order
  const primaryProductId = productIds[0]
  const firstProduct = products.find(p => p.id === primaryProductId) ?? products[0]
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL!

  const paySession = await driver.createPaymentSession({
    orderId:       order.id,
    amount:        Math.round(Number(order.total) * 100),
    currency:      order.currency,
    description:   products.map(p => p.title).join(', '),
    customerEmail: email,
    customerName:  name ?? undefined,
    metadata:      { orderId: order.id, productSlug: firstProduct.slug },
    successUrl:    `${appUrl}/checkout/success?orderId=${order.id}`,
    cancelUrl:     `${appUrl}/checkout/${firstProduct.slug}`,
  })

  return NextResponse.json({ orderId: order.id, redirectUrl: paySession.redirectUrl, embedToken: paySession.embedToken })
}
