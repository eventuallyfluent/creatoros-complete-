import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logger'
import { sendEmail, renderBroadcastHtml } from '@/lib/email/email-service'

// ============================================================
// AUTOMATION ENGINE
//
// Trigger types:
//   ENROLLMENT        — when student enrols in a course (access granted)
//   ACCESS_GRANTED    — alias for ENROLLMENT (SCP pattern)
//   PURCHASE          — when a paid order completes (product-level)
//   LESSON_COMPLETE   — when a lesson is marked complete
//   COURSE_COMPLETE   — when all lessons in a course are done
//   SIGNUP            — when a new account is created
//   TAG_ADDED         — when a tag is added to a subscriber
//   ACCESS_REMOVED    — when enrollment is revoked
//   COUPON_USED       — when a coupon is applied to an order
//   REFUND_ISSUED     — when an order is refunded
//   CHECKOUT_ABANDONED — future: incomplete checkout
//
// Step action types:
//   send_email        { subject, body }
//   delay             { hours: number }  — delays ≤25s execute inline;
//                                         longer delays require an external
//                                         cron job to replay RUNNING executions
//   add_tag           { tag: string }
//   remove_tag        { tag: string }
//   enroll_course     { courseId: string }
//   grant_product     { productId: string }
//   webhook_post      { url: string, payload?: object }
// ============================================================

export interface AutomationContext {
  userId?:    string
  email?:     string
  productId?: string
  courseId?:  string
  orderId?:   string
  lessonId?:  string
  tag?:       string
}

interface TriggerFilter {
  productId?: string | null
  courseId?:  string | null
  tag?:       string | null
}

interface AutomationStep {
  id:         string
  action:     string
  actionData: Record<string, unknown> | null
  sortOrder:  number
}

// Deduplication key prevents double-firing when called from webhook + admin.
// Key includes triggerType AND courseId so bundle courses (same orderId,
// different courseId) each get a unique execution record.
const dedupeKey = (triggerType: string, ctx: AutomationContext) =>
  `${triggerType}:order=${ctx.orderId ?? ''}:course=${ctx.courseId ?? ''}:user=${ctx.userId ?? ''}`

export async function runAutomations(
  triggerType:      string,
  ctx:              AutomationContext,
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where:   { isActive: true, trigger: triggerType },
    include: { steps: { orderBy: { sortOrder: 'asc' } } },
  })

  for (const automation of automations) {
    const filter = automation.triggerFilter as TriggerFilter | null
    if (!matchesTriggerFilter(filter, ctx)) continue

    const dedupe = dedupeKey(triggerType, ctx)
    const existing = await prisma.automationExecution.findFirst({
      where: { automationId: automation.id, deduplicationKey: dedupe },
    }).catch(() => null)
    if (existing) continue

    const execution = await prisma.automationExecution.create({
      data: {
        automationId:     automation.id,
        userId:           ctx.userId,
        context:          ctx as Record<string, unknown>,
        status:           'RUNNING',
        deduplicationKey: dedupe,
      },
    })

    await executeSteps(automation.steps as AutomationStep[], ctx, execution.id)
  }
}

function matchesTriggerFilter(
  filter: TriggerFilter | null,
  ctx:    AutomationContext
): boolean {
  if (!filter) return true
  if (filter.productId && ctx.productId !== filter.productId) return false
  if (filter.courseId  && ctx.courseId  !== filter.courseId)  return false
  if (filter.tag       && ctx.tag       !== filter.tag)       return false
  return true
}

async function executeSteps(
  steps:       AutomationStep[],
  ctx:         AutomationContext,
  executionId: string
): Promise<void> {
  for (const step of steps) {
    try {
      await executeStep(step.action, step.actionData ?? {}, ctx)
      await prisma.automationExecution.update({
        where: { id: executionId },
        data:  { completedSteps: { increment: 1 } },
      }).catch(() => {})
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Automation step failed`, err, { executionId, action: step.action })
      await prisma.automationExecution.update({
        where: { id: executionId },
        data:  { status: 'FAILED', error: msg },
      }).catch(() => {})
      return
    }
  }

  await prisma.automationExecution.update({
    where: { id: executionId },
    data:  { status: 'COMPLETED', completedAt: new Date() },
  }).catch(() => {})
}

async function executeStep(
  action: string,
  data:   Record<string, unknown>,
  ctx:    AutomationContext
): Promise<void> {

  if (action === 'send_email') {
    if (!ctx.email) return

    let productTitle = ''
    let courseTitle  = ''
    let courseSlug   = ''

    if (ctx.productId) {
      const product = await prisma.product.findUnique({
        where:  { id: ctx.productId },
        select: { title: true, slug: true },
      })
      productTitle = product?.title ?? ''
    }

    if (ctx.courseId) {
      const course = await prisma.course.findUnique({
        where:  { id: ctx.courseId },
        select: { title: true, slug: true },
      })
      courseTitle = course?.title ?? ''
      courseSlug  = course?.slug  ?? ''
    }

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const firstName = ctx.email.split('@')[0]
    const vars: Record<string, string> = {
      '{{name}}':           firstName,
      '{{first_name}}':     firstName,
      '{{product_title}}':  productTitle || courseTitle,
      '{{course_title}}':   courseTitle  || productTitle,
      '{{course_url}}':     courseSlug ? `${appUrl}/portal/courses/${courseSlug}` : `${appUrl}/portal`,
      '{{review_url}}':     courseSlug ? `${appUrl}/portal/courses/${courseSlug}/review` : '',
      '{{dashboard_url}}':  `${appUrl}/portal`,
    }

    let subject  = (data.subject as string) ?? 'A message for you'
    let bodyText = (data.body    as string) ?? ''
    for (const [token, value] of Object.entries(vars)) {
      subject  = subject.replaceAll(token, value)
      bodyText = bodyText.replaceAll(token, value)
    }

    const bodyHtml = bodyText.split('\n\n').map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')
    const html     = renderBroadcastHtml(subject, bodyHtml)
    const result   = await sendEmail({ to: ctx.email, subject, html })

    await prisma.emailLog.create({
      data: {
        to:       ctx.email,
        subject,
        type:     'AUTOMATION',
        status:   result.success ? 'SENT' : 'FAILED',
        resendId: result.id ?? null,
      },
    }).catch(() => {})
    return
  }

  if (action === 'enroll_course') {
    if (!ctx.userId || !data.courseId) return
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId: ctx.userId, courseId: data.courseId as string } },
      create: { userId: ctx.userId, courseId: data.courseId as string, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    })
    return
  }

  if (action === 'grant_product') {
    if (!ctx.userId || !data.productId) return
    const product = await prisma.product.findUnique({
      where:   { id: data.productId as string },
      include: { courses: true },
    })
    if (!product) return
    for (const pc of product.courses) {
      await prisma.enrollment.upsert({
        where:  { userId_courseId: { userId: ctx.userId, courseId: pc.courseId } },
        create: { userId: ctx.userId, courseId: pc.courseId, productId: data.productId as string, status: 'ACTIVE' },
        update: { status: 'ACTIVE' },
      })
    }
    return
  }

  if (action === 'add_tag') {
    if (!ctx.email || !data.tag) return
    await prisma.emailSubscriber.updateMany({
      where: { email: ctx.email },
      data:  { tags: { push: data.tag as string } },
    })
    return
  }

  if (action === 'remove_tag') {
    if (!ctx.email || !data.tag) return
    const sub = await prisma.emailSubscriber.findUnique({ where: { email: ctx.email } })
    if (sub) {
      await prisma.emailSubscriber.update({
        where: { email: ctx.email },
        data:  { tags: (sub.tags as string[]).filter((t: string) => t !== data.tag) },
      })
    }
    return
  }

  if (action === 'webhook_post') {
    if (!data.url) return
    await fetch(data.url as string, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...(data.payload as object ?? {}), ...ctx }),
    }).catch(err => logger.error('webhook_post failed', err, { url: data.url as string }))
    return
  }

  if (action === 'delay') {
    const hours = Number(data.hours) || 0
    const ms    = hours * 3_600_000
    if (ms <= 0) return
    // Delays up to 25 seconds execute inline (safe in serverless).
    // Longer delays require an external scheduler: configure a cron job that
    // queries AutomationExecution WHERE status='RUNNING' AND scheduledAt <= NOW
    // and replays the remaining steps.
    if (ms <= 25_000) {
      await new Promise(r => setTimeout(r, ms))
    } else {
      logger.warn('delay action: long delay skipped in serverless context', {
        hours,
        hint: 'Use a cron job to replay RUNNING AutomationExecutions with pending delay steps.',
      })
    }
    return
  }
}
