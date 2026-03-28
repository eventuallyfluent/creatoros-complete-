export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db/prisma'
import { markOrderPaid, refundOrder } from '@/lib/payments/order-service'
import { getGatewayDriver } from '@/lib/payments/gateway-registry'

export async function GET(req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const order = await prisma.order.findUnique({
    where:   { id: params.orderId },
    include: {
      items: {
        include: {
          // OrderItem relates to product, not directly to course
          product: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: NextRequest, { params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action } = body

  const order = await prisma.order.findUnique({ where: { id: params.orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (action === 'mark_paid') {
    if (order.status !== 'PENDING') return NextResponse.json({ error: 'Order is not pending' }, { status: 400 })
    await markOrderPaid(order.id, 'manual', `manual_${Date.now()}`)
    return NextResponse.json({ success: true })
  }

  if (action === 'refund') {
    if (order.status !== 'PAID') return NextResponse.json({ error: 'Order is not paid' }, { status: 400 })

    if (order.gatewayId && order.gatewayPaymentId) {
      const driver = await getGatewayDriver(order.gatewayId)
      if (driver && order.gatewayOrderId) {
        await driver.issueRefund({
          gatewayOrderId:   order.gatewayOrderId,
          gatewayPaymentId: order.gatewayPaymentId,
          amount:           Number(order.total),
        })
      }
    }

    await refundOrder(order.id, Number(order.total), false)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
