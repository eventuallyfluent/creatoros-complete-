// ============================================================
// Creem Driver
// Merchant of Record — handles global tax, cards, PayPal,
// Apple Pay, Google Pay, local methods.
//
// Setup (in Admin → Payments → Add Gateway → select Creem):
//   apiKey         — from Creem Dashboard → Developers → API Keys
//   webhookSecret  — from Creem Dashboard → Developers → Webhooks
//
// Webhook URL to paste in Creem Dashboard → Developers → Webhooks:
//   https://yoursite.com/api/webhooks/[your-gateway-id]
// ============================================================

import * as crypto from 'crypto'
import { GatewayDriver, OrderPayload, PaymentEvent, RefundPayload } from '../gateway-driver'

export class CreemDriver implements GatewayDriver {
  readonly provider = 'creem'

  constructor(private config: {
    apiKey:        string
    webhookSecret: string
    testMode?:     string   // 'true' = sandbox
  }) {}

  private get baseUrl() {
    return this.config.testMode === 'true'
      ? 'https://test-api.creem.io'
      : 'https://api.creem.io'
  }

  async createPaymentSession(order: OrderPayload): Promise<{ redirectUrl: string; sessionId: string }> {
    const res = await fetch(`${this.baseUrl}/v1/checkouts`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-api-key':     this.config.apiKey,
      },
      body: JSON.stringify({
        request_id:   order.orderId,
        product_id:   order.metadata?.creemProductId,
        success_url:  order.successUrl,
        cancel_url:   order.cancelUrl,
        customer: {
          email: order.customerEmail,
          name:  order.customerName,
        },
        metadata: {
          orderId:  order.orderId,
          ...order.metadata,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Creem checkout creation failed: ${err}`)
    }

    const data = await res.json()
    return {
      redirectUrl: data.checkout_url,
      sessionId:   data.id,
    }
  }

  handleWebhook(
    payload: string | Buffer,
    headers: Record<string, string>
  ): Promise<PaymentEvent | null> {
    const sig = headers['creem-signature']
    if (!sig) return Promise.resolve(null)

    const valid = this.verifySignature(payload, headers, this.config.webhookSecret)
    if (!valid) return Promise.resolve(null)

    let body: any
    try {
      body = JSON.parse(payload.toString())
    } catch {
      return Promise.resolve(null)
    }

    const eventType: string = body.eventType ?? ''
    const obj = body.object ?? {}

    if (eventType === 'checkout.completed') {
      const order    = obj.order   ?? {}
      const txn      = obj.transaction ?? {}
      const orderId  = obj.metadata?.orderId ?? order.id
      return Promise.resolve({
        gatewayOrderId:   orderId,
        gatewayPaymentId: txn.id ?? obj.id,
        status:           'paid',
        amount:           txn.amount ?? 0,
        currency:         (txn.currency ?? 'USD').toUpperCase(),
        metadata:         obj.metadata,
      })
    }

    if (eventType === 'refund.created') {
      const txn     = obj.transaction ?? {}
      const orderId = txn.order ?? obj.metadata?.orderId
      return Promise.resolve({
        gatewayOrderId:   orderId,
        gatewayPaymentId: obj.id,
        status:           'refunded',
        amount:           obj.refund_amount ?? 0,
        currency:         (obj.refund_currency ?? 'USD').toUpperCase(),
        metadata:         obj.metadata,
      })
    }

    return Promise.resolve(null)
  }

  verifySignature(
    payload: string | Buffer,
    headers: Record<string, string>,
    secret: string
  ): boolean {
    const signature = headers['creem-signature']
    if (!signature || !secret) return false
    try {
      const computed = crypto
        .createHmac('sha256', secret)
        .update(payload.toString())
        .digest('hex')
      // Use timing-safe comparison to prevent secret enumeration via timing attacks.
      // Must check lengths first — timingSafeEqual throws if buffers differ in length.
      const sigBuf  = Buffer.from(signature, 'hex')
      const compBuf = Buffer.from(computed,  'hex')
      if (sigBuf.length !== compBuf.length) return false
      return crypto.timingSafeEqual(sigBuf, compBuf)
    } catch {
      return false
    }
  }

  async issueRefund(payload: RefundPayload): Promise<{ success: boolean; refundId?: string }> {
    console.warn('Creem refund requested for', payload.gatewayOrderId, '— use Creem dashboard')
    return { success: false }
  }

  async getPaymentStatus(gatewayOrderId: string): Promise<'paid' | 'pending' | 'failed' | 'unknown'> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/checkouts/${gatewayOrderId}`, {
        headers: { 'x-api-key': this.config.apiKey },
      })
      if (!res.ok) return 'unknown'
      const data = await res.json()
      if (data.status === 'completed') return 'paid'
      if (data.status === 'failed')    return 'failed'
      if (data.status === 'pending')   return 'pending'
      return 'unknown'
    } catch {
      return 'unknown'
    }
  }
}
