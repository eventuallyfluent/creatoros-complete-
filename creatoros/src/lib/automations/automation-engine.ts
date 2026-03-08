import { prisma } from '@/lib/db/prisma'
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
//   send_email        { subject, body } — template vars:
//                       {{name}}, {{first_name}},
//                       {{product_title}}, {{course_title}},
//                       {{course_url}}, {{review_url}}, {{dashboard_url}}
//   delay             { hours: number }
//   add_tag           { tag: string }
//   remove_tag        { tag: string }
//   enroll_course     { courseId: string }  — grants course access directly
//   grant_product     { productId: string } — grants all courses in a product
//   webhook_post      { url: string, payload?: object }
//
// Trigger filter supports: courseId, productId, tag
// NOTE: Funnels in SCP attach to checkouts, not products. A funnel-on-checkout
// architecture should be added when upsell/downsell sequences are built.
// ============================================================

export interface AutomationContext {
  userId?:    string
  email?:     string
  productId?: string  // which product triggered (purchase / access grant)
  courseId?:  string  // which course (enrollment / lesson / completion)
  orderId?:   string
  lessonId?:  string
  tag?:       string
}

export async function runAutomations(
  triggerType: string,
  ctx:         AutomationContext
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where:   { isActive: true, trigger: triggerType },
    include: { steps: { orderBy: { sortOrder: 'asc' } } },
  })

  for (const automation of automations) {
    if (!matchesTriggerFilter(automation.triggerFilter as any, ctx)) continue

    const execution = await prisma.automationExecution.create({
      data: {
        automationId: automation.id,
        userId:       ctx.userId,
        context:      ctx as any,
        status:       'RUNNING',
      },
    })

    await executeSteps(automation.steps as any[], ctx, execution.id)
  }
}

function matchesTriggerFilter(
  filter: Record<string, any> | null,
  ctx:    AutomationContext
): boolean {
  if (!filter) return true
  if (filter.productId && ctx.productId !== filter.productId) return false
  if (filter.courseId  && ctx.courseId  !== filter.courseId)  return false
  if (filter.tag       && ctx.tag       !== filter.tag)       return false
  return true
}

async function executeSteps(
  steps:       any[],
  ctx:         AutomationContext,
  executionId: string
): Promise<void> {
  for (const step of steps) {
    try {
      await executeStep(step.action, step.actionData ?? {}, ctx)
      await prisma.automationExecution.update({
        where: { id: executionId },
        data:  { completedSteps: { increment: 1 } },
      })
    } catch (err: any) {
      console.error(`Automation step failed [${executionId}]:`, err)
      await prisma.automationExecution.update({
        where: { id: executionId },
        data:  { status: 'FAILED', error: err.message },
      })
      return
    }
  }

  await prisma.automationExecution.update({
    where: { id: executionId },
    data:  { status: 'COMPLETED', completedAt: new Date() },
  })
}

async function executeStep(
  action: string,
  data:   Record<string, any>,
  ctx:    AutomationContext
): Promise<void> {

  if (action === 'send_email') {
    if (!ctx.email) return

    // Resolve product title (primary) then course title (fallback)
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

    let subject  = data.subject ?? 'A message for you'
    let bodyText = data.body    ?? ''
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
    })
    return
  }

  if (action === 'enroll_course') {
    // Direct course-level access grant (manual/automation)
    if (!ctx.userId || !data.courseId) return
    await prisma.enrollment.upsert({
      where:  { userId_courseId: { userId: ctx.userId, courseId: data.courseId } },
      create: { userId: ctx.userId, courseId: data.courseId, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    })
    return
  }

  if (action === 'grant_product') {
    // Product-level access grant — enrols in all included courses
    if (!ctx.userId || !data.productId) return
    const product = await prisma.product.findUnique({
      where:   { id: data.productId },
      include: { courses: true },
    })
    if (!product) return
    for (const pc of product.courses) {
      await prisma.enrollment.upsert({
        where:  { userId_courseId: { userId: ctx.userId, courseId: pc.courseId } },
        create: { userId: ctx.userId, courseId: pc.courseId, productId: data.productId, status: 'ACTIVE' },
        update: { status: 'ACTIVE' },
      })
    }
    return
  }

  if (action === 'add_tag') {
    if (!ctx.email || !data.tag) return
    await prisma.emailSubscriber.updateMany({
      where: { email: ctx.email },
      data:  { tags: { push: data.tag } },
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
    await fetch(data.url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...data.payload, ...ctx }),
    })
    return
  }

  if (action === 'delay') {
    // Production: schedule a job and resume from next step
    // Dev only: honour very short delays for testing
    if (process.env.NODE_ENV === 'development' && data.hours <= 0.01) {
      await new Promise(r => setTimeout(r, data.hours * 3600000))
    }
    return
  }
}
