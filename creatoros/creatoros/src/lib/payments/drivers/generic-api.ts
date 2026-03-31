// ============================================================
// Generic API Gateway Driver
//
// Handles any payment provider that follows the standard pattern:
//   1. POST to their API → get back a redirect URL
//   2. Student pays on their hosted page
//   3. They POST a webhook to our URL
//   4. We verify + extract orderId → enrol student
//
// All behaviour is driven by config the admin fills in.
// No code changes needed for new providers.
// ============================================================

import * as crypto from 'crypto'
import { GatewayDriver, OrderPayload, PaymentEvent, RefundPayload } from '../gateway-driver'

export class GenericApiDriver implements GatewayDriver {
  readonly provider = 'generic_api'

  constructor(private config: {
    // Checkout session creation
    checkoutApiUrl:      string   // e.g. https://api.myprovider.com/v1/checkout
    authHeaderName:      string   // e.g. Authorization  or  X-Api-Key
    authHeaderValue:     string   // e.g. Bearer sk_live_xxx  or just sk_live_xxx
    checkoutUrlField:    string   // JSON path in response that has the redirect URL e.g. "url" or "checkout_url" or "data.redirect"

    // Order matching — how to find our orderId in the webhook body
    webhookOrderIdField: string   // JSON path in webhook body e.g. "data.metadata.orderId" or "order_id"

    // Webhook signature verification
    webhookSecret?:       string
    webhookSigHeader?:    string  // e.g. "x-signature" or "stripe-signature"
    webhookSigAlgorithm?: string  // "hmac-sha256" (default) | "hmac-sha1" | "none"
    webhookSigEncoding?:  string  // "hex" (default) | "base64"

    // Extra body fields to send in checkout creation (JSON string of key:value pairs)
    extraCheckoutFields?: string  // e.g. '{"currency_code":"USD","locale":"en"}'
  }) {}

  async createPaymentSession(order: OrderPayload): Promise<{ redirectUrl: string; sessionId: string }> {
    const extraFields = this.parseExtra(this.config.extraCheckoutFields)

    const body = {
      ...extraFields,
      amount:         order.amount,
      currency:       order.currency,
      description:    order.description,
      customer_email: order.customerEmail,
      customer_name:  order.customerName,
      success_url:    order.successUrl,
      cancel_url:     order.cancelUrl,
      // Always embed our orderId so we can match the webhook back
      reference:      order.orderId,
      order_id:       order.orderId,
      metadata: {
        orderId: order.orderId,
        ...order.metadata,
      },
    }

    const res = await fetch(this.config.checkoutApiUrl, {
      method:  'POST',
      headers: {
        'Content-Type':                      'application/json',
        [this.config.authHeaderName]:        this.config.authHeaderValue,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gateway checkout creation failed (${res.status}): ${err}`)
    }

    const data = await res.json()

    // Resolve dot-notation path e.g. "data.checkout_url"
    const redirectUrl = this.getPath(data, this.config.checkoutUrlField)
    if (!redirectUrl) {
      throw new Error(`Gateway response did not contain field "${this.config.checkoutUrlField}". Response: ${JSON.stringify(data).slice(0, 300)}`)
    }

    return {
      redirectUrl,
      sessionId: data.id ?? data.session_id ?? data.checkout_id ?? order.orderId,
    }
  }

  handleWebhook(payload: string | Buffer, headers: Record<string, string>): Promise<PaymentEvent | null> {
    // Verify signature if configured
    if (this.config.webhookSecret && this.config.webhookSigHeader) {
      const valid = this.verifySignature(payload, headers, this.config.webhookSecret)
      if (!valid) return Promise.resolve(null)
    }

    let body: any
    try { body = JSON.parse(payload.toString()) } catch { return Promise.resolve(null) }

    // Extract orderId from configured path
    const orderId = this.getPath(body, this.config.webhookOrderIdField)
    if (!orderId) return Promise.resolve(null)

    return Promise.resolve({
      gatewayOrderId:   orderId,
      gatewayPaymentId: body.id ?? body.payment_id ?? body.transaction_id ?? orderId,
      status:           'paid',
      amount:           body.amount ?? body.total ?? 0,
      currency:         (body.currency ?? 'USD').toUpperCase(),
      metadata:         body.metadata ?? body.meta ?? {},
    })
  }

  verifySignature(payload: string | Buffer, headers: Record<string, string>, secret: string): boolean {
    const sigHeader = this.config.webhookSigHeader?.toLowerCase()
    if (!sigHeader || !secret) return true // no verification configured = pass through

    const signature = headers[sigHeader]
    if (!signature) return false

    const algorithm = this.config.webhookSigAlgorithm ?? 'hmac-sha256'
    const encoding  = (this.config.webhookSigEncoding ?? 'hex') as BufferEncoding

    if (algorithm === 'none') return true

    try {
      const hmacAlgo = algorithm.replace('hmac-', '') // 'sha256' or 'sha1'
      const computed = crypto
        .createHmac(hmacAlgo, secret)
        .update(payload.toString())
        .digest(encoding)
      return crypto.timingSafeEqual(Buffer.from(signature, encoding), Buffer.from(computed, encoding))
    } catch {
      return false
    }
  }

  async issueRefund(_payload: RefundPayload): Promise<{ success: boolean }> {
    // Generic refund not implemented — use provider dashboard
    return { success: false }
  }

  async getPaymentStatus(_gatewayOrderId: string): Promise<'paid' | 'pending' | 'failed' | 'unknown'> {
    return 'unknown'
  }

  // Resolve a dot-notation path in an object: "data.checkout_url" → obj.data.checkout_url
  private getPath(obj: any, path: string): string | null {
    if (!path || !obj) return null
    const parts = path.split('.')
    let cur = obj
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') return null
      cur = cur[p]
    }
    return typeof cur === 'string' ? cur : null
  }

  private parseExtra(raw?: string): Record<string, any> {
    if (!raw) return {}
    try { return JSON.parse(raw) } catch { return {} }
  }
}
