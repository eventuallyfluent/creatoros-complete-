export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getGatewayDriver } from '@/lib/payments/gateway-registry'
import { fulfilOrder, refundOrder } from '@/lib/payments/order-service'

// ============================================================
// UNIVERSAL WEBHOOK ENDPOINT
// /api/webhooks/[gatewayId]
//
// Every gateway gets its own inbound URL:
// /api/webhooks/gw_a1b2c3 (gatewayId from DB)
//
// This single handler processes any gateway's webhook by:
// 1. Looking up the gateway by ID
// 2. Loading the correct driver
// 3. Verifying signature
// 4. Normalising to PaymentEvent
// 5. Updating order and fulfilling
//
// Adding a new gateway requires zero changes here.
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { gatewayId: string } }
) {
  const gateway = await prisma.paymentGateway.findUnique({
    where: { id: params.gatewayId, isActive: true },
  })

  if (!gateway) {
    return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
  }

  // Read raw body for signature verification
  const rawBody = await req.text()
  const headers = Object.fromEntries(req.headers.entries())

  const driver = await getGatewayDriver(params.gatewayId)
  if (!driver) {
    await logWebhook(params.gatewayId, 'INBOUND', 'webhook.received', {}, false, 'No driver found')
    return NextResponse.json({ error: 'No driver' }, { status: 500 })
  }

  // Verify signature
  const secret = (gateway.config as any)?.webhookSecret ?? gateway.webhookSecret ?? ''
  const isValid = driver.verifySignature(rawBody, headers, secret)

  if (!isValid) {
    await logWebhook(params.gatewayId, 'INBOUND', 'webhook.received', {}, false, 'Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse webhook
  let event
  try {
    event = await driver.handleWebhook(rawBody, headers)
  } catch (err: any) {
    await logWebhook(params.gatewayId, 'INBOUND', 'webhook.error', {}, false, err.message)
    return NextResponse.json({ error: 'Parse error' }, { status: 400 })
  }

  if (!event) {
    // Not a relevant event type — acknowledge and ignore
    return NextResponse.json({ received: true })
  }

  // Find our order by gateway order ID
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { gatewayOrderId: event.gatewayOrderId },
        { id: event.gatewayOrderId }, // Some gateways echo back our orderId
      ],
    },
  })

  if (!order) {
    await logWebhook(params.gatewayId, 'INBOUND', event.status, {}, false, `Order not found: ${event.gatewayOrderId}`)
    // Return 200 so gateway doesn't retry — order may legitimately not exist (test events, etc.)
    return NextResponse.json({ received: true })
  }

  try {
    if (event.status === 'paid') {
      // Atomic claim: only one concurrent webhook wins — updateMany WHERE status=PENDING
      // returns count=0 if another request already claimed it
      const claimed = await prisma.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data:  {
          status:           'PAID',
          gatewayOrderId:   event.gatewayOrderId,
          gatewayPaymentId: event.gatewayPaymentId ?? null,
          paidAt:           new Date(),
        },
      })
      if (claimed.count === 0) {
        await logWebhook(params.gatewayId, 'INBOUND', 'order.paid.duplicate', { orderId: order.id }, true, 'Already processed')
        return NextResponse.json({ received: true })
      }
      await fulfilOrder(order.id)
      await logWebhook(params.gatewayId, 'INBOUND', 'order.paid', { orderId: order.id }, true)
    }

    if (event.status === 'refunded' && order.status !== 'REFUNDED') {
      await refundOrder(order.id, event.amount, false)
      await logWebhook(params.gatewayId, 'INBOUND', 'order.refunded', { orderId: order.id }, true)
    }

    if (event.status === 'partially_refunded') {
      await refundOrder(order.id, event.amount, true)
      await logWebhook(params.gatewayId, 'INBOUND', 'order.partially_refunded', { orderId: order.id }, true)
    }
  } catch (err: any) {
    await logWebhook(params.gatewayId, 'INBOUND', event.status, { orderId: order.id }, false, err.message)
    return NextResponse.json({ error: 'Fulfilment error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// Acknowledge HEAD/GET pings from gateways testing connectivity
export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

async function logWebhook(
  gatewayId: string,
  direction: string,
  event:     string,
  payload:   object,
  success:   boolean,
  error?:    string
) {
  try {
    await prisma.webhookLog.create({
      data: {
        gatewayId,
        direction,
        event,
        payload: { ...payload, error },
        success,
      },
    })
  } catch (e) {
    // Don't throw — logging failure shouldn't break webhook processing
    console.error('Failed to log webhook:', e)
  }
}
