// ============================================================
// CreatorOS — Universal Payment Gateway Interface
//
// Every payment gateway implements this interface.
// Checkout, orders, and webhooks never reference a specific
// gateway — they talk to this interface only.
//
// To add a new gateway (Stripe, PayPal, ECPay, Razorpay,
// Mercado Pago, any gateway in any country):
// 1. Create a new driver in /src/lib/payments/drivers/
// 2. Implement GatewayDriver
// 3. Register in gateway-registry.ts
// Zero changes to checkout or order code.
// ============================================================

export interface OrderPayload {
  orderId:     string
  amount:      number       // in smallest unit (cents, etc.)
  currency:    string
  description: string
  customerEmail: string
  customerName?: string
  metadata?:   Record<string, string>
  successUrl:  string
  cancelUrl:   string
}

export interface PaymentEvent {
  gatewayOrderId:   string
  gatewayPaymentId: string
  status:           'paid' | 'failed' | 'refunded' | 'partially_refunded'
  amount:           number
  currency:         string
  metadata?:        Record<string, any>
}

export interface RefundPayload {
  gatewayOrderId:   string
  gatewayPaymentId: string
  amount:           number    // partial or full
  reason?:          string
}

export interface GatewayDriver {
  // Unique identifier — matches PaymentGateway.provider in DB
  readonly provider: string

  // Create a payment session — returns a URL to redirect the customer to
  // or an embed token for inline payment forms
  createPaymentSession(order: OrderPayload): Promise<{
    redirectUrl?: string
    embedToken?:  string
    sessionId:    string
  }>

  // Validate and parse an incoming webhook
  // Returns null if signature is invalid (reject the request)
  handleWebhook(
    payload: string | Buffer,
    headers: Record<string, string>
  ): Promise<PaymentEvent | null>

  // Verify webhook signature only (called before handleWebhook)
  verifySignature(
    payload: string | Buffer,
    headers: Record<string, string>,
    secret:  string
  ): boolean

  // Issue a full or partial refund
  issueRefund(payload: RefundPayload): Promise<{ success: boolean; refundId?: string }>

  // Poll payment status (for gateways that don't send webhooks)
  getPaymentStatus(gatewayOrderId: string): Promise<'paid' | 'pending' | 'failed' | 'unknown'>
}

// ============================================================
// MANUAL GATEWAY — Admin marks as paid manually
// Always available — bank transfers, cash, etc.
// ============================================================
export class ManualGatewayDriver implements GatewayDriver {
  readonly provider = 'manual'

  constructor(private config: Record<string, string> = {}) {}

  async createPaymentSession(order: OrderPayload) {
    // Encode bank details into pending page URL so student sees them
    const params = new URLSearchParams({ orderId: order.orderId })
    if (this.config.bankName)      params.set('bankName',      this.config.bankName)
    if (this.config.accountName)   params.set('accountName',   this.config.accountName)
    if (this.config.accountNumber) params.set('accountNumber', this.config.accountNumber)
    if (this.config.sortCode)      params.set('sortCode',      this.config.sortCode)
    if (this.config.iban)          params.set('iban',          this.config.iban)
    if (this.config.bic)           params.set('bic',           this.config.bic)
    if (this.config.reference)     params.set('reference',     order.orderId.slice(0, 8).toUpperCase())
    if (this.config.instructions)  params.set('instructions',  this.config.instructions)
    const amount = (order.amount / 100).toFixed(2)
    params.set('amount',   amount)
    params.set('currency', order.currency.toUpperCase())
    return {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/bank-transfer?${params.toString()}`,
      sessionId: order.orderId,
    }
  }

  async handleWebhook() { return null }

  verifySignature() { return true }

  async issueRefund() { return { success: true } }

  async getPaymentStatus() { return 'pending' as const }
}

// ============================================================
// WEBHOOK-ONLY GATEWAY — Provider posts to our webhook
// Gateway doesn't need an SDK — just validates signature
// ============================================================
export class WebhookOnlyGatewayDriver implements GatewayDriver {
  readonly provider = 'webhook_only'

  constructor(private config: { name: string; webhookSecret: string }) {}

  async createPaymentSession(order: OrderPayload) {
    // Redirect to a pending page — payment confirmed via webhook
    return {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending?orderId=${order.orderId}`,
      sessionId: order.orderId,
    }
  }

  async handleWebhook(payload: string | Buffer, headers: Record<string, string>) {
    // Each webhook-only gateway defines its own signature format
    // in the admin config. This base class returns null — subclass it.
    return null
  }

  verifySignature(payload: string | Buffer, headers: Record<string, string>, secret: string) {
    // Implemented per-gateway in admin config
    return false
  }

  async issueRefund() { return { success: false } }
  async getPaymentStatus() { return 'unknown' as const }
}
