import { GatewayDriver, OrderPayload, PaymentEvent } from '../gateway-driver'
import crypto from 'crypto'

export class StripeDriver implements GatewayDriver {
  readonly provider = 'stripe'

  constructor(private config: {
    secretKey:      string
    publishableKey: string
    webhookSecret:  string
  }) {}

  async createPaymentSession(order: OrderPayload) {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode':                               'payment',
        'customer_email':                     order.customerEmail,
        'line_items[0][price_data][currency]':               order.currency.toLowerCase(),
        'line_items[0][price_data][unit_amount]':            String(order.amount),
        'line_items[0][price_data][product_data][name]':     order.description,
        'line_items[0][quantity]':            '1',
        'success_url':                        order.successUrl!,
        'cancel_url':                         order.cancelUrl!,
        'metadata[orderId]':                  order.orderId,
        'payment_intent_data[metadata][orderId]': order.orderId,
      }).toString(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Stripe error: ${(err as any).error?.message ?? res.statusText}`)
    }

    const session = await res.json()
    return {
      redirectUrl: session.url,
      sessionId:   session.id,
    }
  }

  async handleWebhook(payload: string, headers: Record<string, string>): Promise<PaymentEvent | null> {
    const sig    = headers['stripe-signature'] ?? ''
    const secret = this.config.webhookSecret

    if (secret && !this.verifySignature(payload, headers, secret)) {
      return null
    }

    let event: any
    try { event = JSON.parse(payload) } catch { return null }

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const obj     = event.data.object
      const orderId = obj.metadata?.orderId ?? obj.payment_intent?.metadata?.orderId
      if (!orderId) return null
      return {
        gatewayOrderId:   orderId,
        gatewayPaymentId: obj.id,
        status:           'paid' as const,
        amount:           obj.amount_total ?? obj.amount_received ?? 0,
        currency:         obj.currency?.toUpperCase() ?? 'USD',
        metadata:         obj.metadata ?? {},
      }
    }

    if (event.type === 'charge.refunded') {
      const orderId = event.data.object.metadata?.orderId
      if (!orderId) return null
      return {
        gatewayOrderId:   orderId,
        gatewayPaymentId: event.data.object.id,
        status:           'refunded' as const,
        amount:           event.data.object.amount_refunded ?? 0,
        currency:         event.data.object.currency?.toUpperCase() ?? 'USD',
        metadata:         event.data.object.metadata ?? {},
      }
    }

    return null
  }

  verifySignature(payload: string, headers: Record<string, string>, secret: string): boolean {
    const sig = headers['stripe-signature'] ?? ''
    if (!sig || !secret) return !secret // if no secret configured, skip check

    try {
      const parts  = Object.fromEntries(sig.split(',').map(p => p.split('=')))
      const ts     = parts['t']
      const sigV1  = parts['v1']
      if (!ts || !sigV1) return false

      const signed   = `${ts}.${payload}`
      const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex')

      // timingSafeEqual throws if buffers have different byte lengths.
      // Check lengths explicitly first so a malformed incoming signature
      // returns false instead of crashing with a TypeError (500).
      const sigBuf = Buffer.from(sigV1,    'hex')
      const expBuf = Buffer.from(expected, 'hex')
      if (sigBuf.length !== expBuf.length) return false

      return crypto.timingSafeEqual(sigBuf, expBuf)
    } catch {
      return false
    }
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<'paid' | 'pending' | 'failed' | 'unknown'> {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${gatewayOrderId}`, {
      headers: { 'Authorization': `Bearer ${this.config.secretKey}` },
    })
    if (!res.ok) return 'unknown'
    const session = await res.json()
    if (session.payment_status === 'paid')   return 'paid'
    if (session.payment_status === 'unpaid') return 'pending'
    return 'unknown'
  }

  async issueRefund(payload: import('../gateway-driver').RefundPayload) {
    const body: Record<string, string> = { payment_intent: payload.gatewayPaymentId }
    if (payload.amount) body.amount = String(payload.amount)

    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    })
    return { success: res.ok }
  }
}
