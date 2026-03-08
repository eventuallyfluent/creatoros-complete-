import { GatewayDriver, ManualGatewayDriver, WebhookOnlyGatewayDriver } from './gateway-driver'
import { prisma } from '@/lib/db/prisma'

// ============================================================
// GATEWAY REGISTRY
//
// When a new gateway driver is built, import and register it
// here. That's the only change needed anywhere in the codebase.
//
// Example — adding Stripe:
// import { StripeDriver } from './drivers/stripe'
// registry.set('stripe', (config) => new StripeDriver(config))
// ============================================================

type DriverFactory = (config: any) => GatewayDriver

const registry = new Map<string, DriverFactory>([
  ['manual',       (config) => new ManualGatewayDriver(config)],
  ['webhook_only', (config) => new WebhookOnlyGatewayDriver(config)],
  // Future gateways registered here — no other files touched:
  // ['stripe',        (config) => new StripeDriver(config)],
  // ['paypal',        (config) => new PayPalDriver(config)],
  // ['nowpayments',   (config) => new NowPaymentsDriver(config)],
  // ['ecpay',         (config) => new ECPayDriver(config)],
  // ['razorpay',      (config) => new RazorpayDriver(config)],
  // ['mercadopago',   (config) => new MercadoPagoDriver(config)],
  // ['paymongo',      (config) => new PayMongoDriver(config)],
])

export async function getGatewayDriver(gatewayId: string): Promise<GatewayDriver | null> {
  const gateway = await prisma.paymentGateway.findUnique({
    where: { id: gatewayId, isActive: true },
  })

  if (!gateway) return null

  const factory = registry.get(gateway.provider)
  if (!factory) {
    console.error(`No driver registered for gateway provider: ${gateway.provider}`)
    return null
  }

  return factory(gateway.config ?? {})
}

export async function getDefaultGateway() {
  const gateway = await prisma.paymentGateway.findFirst({
    where:   { isDefault: true, isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  return gateway
}

export async function getActiveGateways() {
  return prisma.paymentGateway.findMany({
    where:   { isActive: true },
    orderBy: { isDefault: 'desc' },
  })
}

export function isProviderRegistered(provider: string): boolean {
  return registry.has(provider)
}
