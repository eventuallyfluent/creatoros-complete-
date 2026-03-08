#!/usr/bin/env node
/**
 * CreatorOS Pre-Zip Self-Check
 * Run before every zip. Must pass 100% before zipping.
 * Usage: node scripts/check.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..')
let passed    = 0
let failed    = 0
const failures = []

function check(description, fn) {
  try {
    const result = fn()
    if (result === false) {
      failures.push(`✗ ${description}`)
      failed++
    } else {
      passed++
    }
  } catch (e) {
    failures.push(`✗ ${description} — ${e.message}`)
    failed++
  }
}

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath))
}

function fileContains(relPath, str) {
  if (!exists(relPath)) return false
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8').includes(str)
}

function fileNotContains(relPath, str) {
  if (!exists(relPath)) return true
  return !fs.readFileSync(path.join(ROOT, relPath), 'utf8').includes(str)
}

function noOrphanedDirectory(relPath) {
  return !fs.existsSync(path.join(ROOT, relPath))
}

// ─────────────────────────────────────────────
// PHASE 1 — Foundation
// ─────────────────────────────────────────────
console.log('\n📋 Phase 1 — Foundation')

check('prisma/schema.prisma exists',           () => exists('prisma/schema.prisma'))
check('src/middleware.ts exists',              () => exists('src/middleware.ts'))
check('src/app/layout.tsx exists',             () => exists('src/app/layout.tsx'))
check('globals.css has --brand variable',      () => fileContains('src/styles/globals.css', '--brand:'))
check('globals.css has .btn-primary class',    () => fileContains('src/styles/globals.css', '.btn-primary'))
check('globals.css has .portal-layout class',  () => fileContains('src/styles/globals.css', '.portal-layout'))
check('globals.css has .admin-layout class',   () => fileContains('src/styles/globals.css', '.admin-layout'))
check('globals.css has .platform-container',   () => fileContains('src/styles/globals.css', '.platform-container'))
check('Button.tsx exists',                     () => exists('src/components/ui/Button.tsx'))
check('Badge.tsx exists',                      () => exists('src/components/ui/Badge.tsx'))
check('Navbar.tsx exists',                     () => exists('src/components/layout/Navbar.tsx'))
check('Footer.tsx exists',                     () => exists('src/components/layout/Footer.tsx'))
check('PortalSidebar.tsx exists',              () => exists('src/components/portal/PortalSidebar.tsx'))
check('auth-options.ts exists',                () => exists('src/lib/auth/auth-options.ts'))
check('auth-options includes session callback',() => fileContains('src/lib/auth/auth-options.ts', 'session.user.id'))
check('magic-link.ts exists',                  () => exists('src/lib/email/magic-link.ts'))
check('prisma.ts singleton exists',            () => exists('src/lib/db/prisma.ts'))
check('next-auth types declared',              () => exists('src/types/next-auth.d.ts'))
check('package.json has next-auth',            () => fileContains('package.json', 'next-auth'))
check('package.json has @supabase/supabase-js',() => fileContains('package.json', '@supabase/supabase-js'))
check('package.json has nanoid',               () => fileContains('package.json', 'nanoid'))
check('package.json has resend',               () => fileContains('package.json', 'resend'))
check('package.json has lucide-react',         () => fileContains('package.json', 'lucide-react'))
check('.env.example exists',                   () => exists('.env.example'))
check('.gitignore exists',                     () => exists('.gitignore'))

// ─────────────────────────────────────────────
// PHASE 2 — Public pages + course player
// ─────────────────────────────────────────────
console.log('\n📋 Phase 2 — Public pages + Course player')

check('Homepage exists at (public)/page.tsx',                 () => exists('src/app/(public)/page.tsx'))
check('Login page exists',                                    () => exists('src/app/(public)/login/page.tsx'))
check('Courses catalog page exists',                          () => exists('src/app/(public)/courses/page.tsx'))
check('Course sales page exists',                             () => exists('src/app/(public)/courses/[slug]/page.tsx'))
check('Collections list page exists',                         () => exists('src/app/(public)/collections/page.tsx'))
check('Collection detail page exists',                        () => exists('src/app/(public)/collections/[slug]/page.tsx'))
check('Instructors page exists',                              () => exists('src/app/(public)/instructors/page.tsx'))
check('Instructor profile page exists',                       () => exists('src/app/(public)/instructors/[slug]/page.tsx'))

// CRITICAL: Portal at correct route (not conflicting with /)
check('Portal dashboard at /portal (not /)',                  () => exists('src/app/(portal)/portal/page.tsx'))
check('NO route conflict — (portal)/page.tsx must NOT exist', () => noOrphanedDirectory('src/app/(portal)/page.tsx'))
check('Portal course overview at correct path',               () => exists('src/app/(portal)/portal/courses/[slug]/page.tsx'))
check('Lesson player page at correct path',                   () => exists('src/app/(portal)/portal/courses/[slug]/[lessonId]/page.tsx'))
check('LessonPlayer.tsx at correct path',                     () => exists('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx'))
check('CourseSidebar.tsx at correct path',                    () => exists('src/app/(portal)/portal/courses/[slug]/[lessonId]/CourseSidebar.tsx'))
check('Lesson actions.ts at correct path',                    () => exists('src/app/(portal)/portal/courses/[slug]/[lessonId]/actions.ts'))
check('actions.ts has markLessonComplete',                    () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/actions.ts', 'markLessonComplete'))
check('Enrollments API exists',                               () => exists('src/app/api/enrollments/route.ts'))
check('Subscribers API exists',                               () => exists('src/app/api/subscribers/route.ts'))

// ─────────────────────────────────────────────
// PHASE 3 — Checkout + Payments
// ─────────────────────────────────────────────
console.log('\n📋 Phase 3 — Checkout + Payments')

check('gateway-driver.ts exists',            () => exists('src/lib/payments/gateway-driver.ts'))
check('gateway-registry.ts exists',          () => exists('src/lib/payments/gateway-registry.ts'))
check('order-service.ts exists',             () => exists('src/lib/payments/order-service.ts'))
check('order-service has fulfilOrder',       () => fileContains('src/lib/payments/order-service.ts', 'fulfilOrder'))
check('order-service has markOrderPaid',     () => fileContains('src/lib/payments/order-service.ts', 'markOrderPaid'))
check('order-service Prisma bug is fixed',   () => fileNotContains('src/lib/payments/order-service.ts', 'prisma.coupon.fields'))
check('Checkout page [slug] exists',         () => exists('src/app/(public)/checkout/[slug]/page.tsx'))
check('CheckoutForm.tsx exists',             () => exists('src/app/(public)/checkout/[slug]/CheckoutForm.tsx'))
check('Checkout success page exists',        () => exists('src/app/(public)/checkout/success/page.tsx'))
check('Checkout pending page exists',        () => exists('src/app/(public)/checkout/pending/page.tsx'))
check('Orders POST API exists',              () => exists('src/app/api/orders/route.ts'))
check('Orders [orderId] API exists',         () => exists('src/app/api/orders/[orderId]/route.ts'))
check('Webhook handler exists',              () => exists('src/app/api/webhooks/[gatewayId]/route.ts'))
check('Coupon validate API exists',          () => exists('src/app/api/coupons/validate/route.ts'))

// ─────────────────────────────────────────────
// PHASE 4 — Admin Course Builder
// ─────────────────────────────────────────────
console.log('\n📋 Phase 4 — Admin Course Builder')

check('Admin layout exists',                    () => exists('src/app/(admin)/layout.tsx'))
check('Admin dashboard exists',                 () => exists('src/app/(admin)/admin/page.tsx'))
check('Admin courses list exists',              () => exists('src/app/(admin)/admin/courses/page.tsx'))
check('Admin new course page exists',           () => exists('src/app/(admin)/admin/courses/new/page.tsx'))
check('Admin edit course page exists',          () => exists('src/app/(admin)/admin/courses/[courseId]/edit/page.tsx'))
check('Admin students list exists',             () => exists('src/app/(admin)/admin/students/page.tsx'))
check('Admin CSV import page exists',           () => exists('src/app/(admin)/admin/students/import/page.tsx'))
check('AdminSidebar.tsx exists',                () => exists('src/components/admin/AdminSidebar.tsx'))
check('AdminPageHeader.tsx exists',             () => exists('src/components/admin/AdminPageHeader.tsx'))
check('CourseEditor.tsx exists',                () => exists('src/components/admin/CourseEditor.tsx'))
check('CurriculumBuilder.tsx exists',           () => exists('src/components/admin/CurriculumBuilder.tsx'))
check('Courses POST API exists',                () => exists('src/app/api/courses/route.ts'))
check('Courses PATCH API exists',               () => exists('src/app/api/courses/[courseId]/route.ts'))
check('Modules API exists',                     () => exists('src/app/api/courses/[courseId]/modules/route.ts'))
check('Module PATCH/DELETE API exists',         () => exists('src/app/api/courses/[courseId]/modules/[moduleId]/route.ts'))
check('Lessons POST API exists',                () => exists('src/app/api/courses/[courseId]/modules/[moduleId]/lessons/route.ts'))
check('Lesson PATCH/DELETE API exists',         () => exists('src/app/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts'))
check('Upload API exists',                      () => exists('src/app/api/upload/route.ts'))
check('CSV import API exists',                  () => exists('src/app/api/csv-import/route.ts'))

// ─────────────────────────────────────────────
// PHASE 5 — Orders, Coupons, Gateways
// ─────────────────────────────────────────────
console.log('\n📋 Phase 5 — Orders, Coupons, Gateways')

check('Admin orders list exists',            () => exists('src/app/(admin)/admin/orders/page.tsx'))
check('Admin order detail exists',           () => exists('src/app/(admin)/admin/orders/[orderId]/page.tsx'))
check('OrderActions.tsx exists',             () => exists('src/app/(admin)/admin/orders/[orderId]/OrderActions.tsx'))
check('Admin coupons list exists',           () => exists('src/app/(admin)/admin/coupons/page.tsx'))
check('Admin new coupon page exists',        () => exists('src/app/(admin)/admin/coupons/new/page.tsx'))
check('Admin edit coupon page exists',       () => exists('src/app/(admin)/admin/coupons/[couponId]/edit/page.tsx'))
check('Admin payments page exists',          () => exists('src/app/(admin)/admin/payments/page.tsx'))
check('GatewayManager.tsx exists',           () => exists('src/app/(admin)/admin/payments/GatewayManager.tsx'))
check('CouponEditor.tsx exists',             () => exists('src/components/admin/CouponEditor.tsx'))
check('Coupons POST API exists',             () => exists('src/app/api/coupons/route.ts'))
check('Coupon PATCH API exists',             () => exists('src/app/api/coupons/[couponId]/route.ts'))
check('Gateways POST API exists',            () => exists('src/app/api/gateways/route.ts'))
check('Gateway PATCH/DELETE API exists',     () => exists('src/app/api/gateways/[gatewayId]/route.ts'))

// ─────────────────────────────────────────────
// PHASE 6 — Email system
// ─────────────────────────────────────────────
console.log('\n📋 Phase 6 — Email system')

check('email-service.ts exists',              () => exists('src/lib/email/email-service.ts'))
check('email-service has sendEmail fn',        () => fileContains('src/lib/email/email-service.ts', 'export async function sendEmail'))
check('email-service has sendBroadcast fn',    () => fileContains('src/lib/email/email-service.ts', 'export async function sendBroadcast'))
check('email-service has renderBroadcastHtml', () => fileContains('src/lib/email/email-service.ts', 'renderBroadcastHtml'))
check('Admin subscribers page exists',         () => exists('src/app/(admin)/admin/subscribers/page.tsx'))
check('Admin emails list page exists',         () => exists('src/app/(admin)/admin/emails/page.tsx'))
check('Admin new broadcast page exists',       () => exists('src/app/(admin)/admin/emails/new/page.tsx'))
check('BroadcastComposer.tsx exists',          () => exists('src/app/(admin)/admin/emails/new/BroadcastComposer.tsx'))
check('Broadcast send API exists',             () => exists('src/app/api/emails/broadcast/route.ts'))
check('Test email API exists',                 () => exists('src/app/api/emails/send-test/route.ts'))
check('Subscriber export API exists',          () => exists('src/app/api/subscribers/export/route.ts'))
check('Resend webhook handler exists',         () => exists('src/app/api/webhooks/resend/route.ts'))
check('Unsubscribe page exists',               () => exists('src/app/(public)/unsubscribe/page.tsx'))

// ─────────────────────────────────────────────
// PHASE 7 — Automations
// ─────────────────────────────────────────────
console.log('\n📋 Phase 7 — Automations')

check('automation-engine.ts exists',                () => exists('src/lib/automations/automation-engine.ts'))
check('automation-engine has runAutomations',        () => fileContains('src/lib/automations/automation-engine.ts', 'export async function runAutomations'))
check('automation-engine handles send_email',        () => fileContains('src/lib/automations/automation-engine.ts', "action === 'send_email'"))
check('automation-engine handles enroll_course',     () => fileContains('src/lib/automations/automation-engine.ts', "action === 'enroll_course'"))
check('Admin automations list page exists',          () => exists('src/app/(admin)/admin/automations/page.tsx'))
check('Admin new automation page exists',            () => exists('src/app/(admin)/admin/automations/new/page.tsx'))
check('Admin edit automation page exists',           () => exists('src/app/(admin)/admin/automations/[automationId]/edit/page.tsx'))
check('AutomationBuilder.tsx exists',                () => exists('src/components/admin/AutomationBuilder.tsx'))
check('Automations POST API exists',                 () => exists('src/app/api/automations/route.ts'))
check('Automation PATCH/DELETE API exists',          () => exists('src/app/api/automations/[automationId]/route.ts'))
check('order-service fires PURCHASE automation',     () => fileContains('src/lib/payments/order-service.ts', "runAutomations('PURCHASE'"))
check('order-service fires ENROLLMENT automation',   () => fileContains('src/lib/payments/order-service.ts', "runAutomations('ENROLLMENT'"))
check('actions.ts fires LESSON_COMPLETE',            () => fileContains("src/app/(portal)/portal/courses/[slug]/[lessonId]/actions.ts", "LESSON_COMPLETE"))
check('actions.ts fires COURSE_COMPLETE',            () => fileContains("src/app/(portal)/portal/courses/[slug]/[lessonId]/actions.ts", "COURSE_COMPLETE"))

// ─────────────────────────────────────────────
// PHASE 8 — Analytics
// ─────────────────────────────────────────────
console.log('\n📋 Phase 8 — Analytics')

check('analytics-service.ts exists',             () => exists('src/lib/analytics/analytics-service.ts'))
check('analytics-service has getRevenueStats',    () => fileContains('src/lib/analytics/analytics-service.ts', 'getRevenueStats'))
check('analytics-service has getCourseStats',     () => fileContains('src/lib/analytics/analytics-service.ts', 'getCourseStats'))
check('Admin analytics page exists',              () => exists('src/app/(admin)/admin/analytics/page.tsx'))
check('AnalyticsDashboard.tsx exists',            () => exists('src/app/(admin)/admin/analytics/AnalyticsDashboard.tsx'))
check('Analytics API exists',                     () => exists('src/app/api/analytics/route.ts'))

// ─────────────────────────────────────────────
// PHASE 9 — Branding & Settings
// ─────────────────────────────────────────────
console.log('\n📋 Phase 9 — Branding & Settings')

check('site-settings.ts exists',                  () => exists('src/lib/settings/site-settings.ts'))
check('site-settings has getSiteSettings',         () => fileContains('src/lib/settings/site-settings.ts', 'getSiteSettings'))
check('site-settings has updateSiteSettings',      () => fileContains('src/lib/settings/site-settings.ts', 'updateSiteSettings'))
check('site-settings uses actual prisma model',    () => fileContains('src/lib/settings/site-settings.ts', 'siteSetting.findUnique'))
check('Admin branding page exists',                () => exists('src/app/(admin)/admin/branding/page.tsx'))
check('BrandingEditor.tsx exists',                 () => exists('src/app/(admin)/admin/branding/BrandingEditor.tsx'))
check('Branding settings API exists',              () => exists('src/app/api/settings/branding/route.ts'))

// ─────────────────────────────────────────────
// SCHEMA INTEGRITY
// ─────────────────────────────────────────────
console.log('\n📋 Schema integrity')

check('Schema has EmailLog model',                 () => fileContains('prisma/schema.prisma', 'model EmailLog'))
check('Schema has AutomationStep model',           () => fileContains('prisma/schema.prisma', 'model AutomationStep'))
check('Schema has AutomationExecution model',      () => fileContains('prisma/schema.prisma', 'model AutomationExecution'))
check('Schema Automation has relational steps',    () => fileContains('prisma/schema.prisma', 'steps      AutomationStep[]'))
check('Schema Automation trigger is String',       () => fileContains('prisma/schema.prisma', 'trigger       String'))
check('Schema has SiteSetting model',              () => fileContains('prisma/schema.prisma', 'model SiteSetting'))
check('Schema EmailSubscriber has tags field',     () => fileContains('prisma/schema.prisma', 'tags   String[]'))

// ─────────────────────────────────────────────
// PHASE 10 — Navigation editor
// ─────────────────────────────────────────────
console.log('\n📋 Phase 10 — Navigation editor')

check('Admin navigation page exists',            () => exists('src/app/(admin)/admin/navigation/page.tsx'))
check('NavEditor.tsx exists',                    () => exists('src/app/(admin)/admin/navigation/NavEditor.tsx'))
check('Navigation settings API exists',          () => exists('src/app/api/settings/navigation/route.ts'))
check('SiteSettings has headerNav field',        () => fileContains('src/lib/settings/site-settings.ts', 'headerNav'))
check('SiteSettings has footerNav field',        () => fileContains('src/lib/settings/site-settings.ts', 'footerNav'))

// ─────────────────────────────────────────────
// PHASE 11 — Student account
// ─────────────────────────────────────────────
console.log('\n📋 Phase 11 — Student account')

check('Portal account page exists',              () => exists('src/app/(portal)/portal/account/page.tsx'))
check('AccountClient.tsx exists',                () => exists('src/app/(portal)/portal/account/AccountClient.tsx'))
check('Account profile API exists',              () => exists('src/app/api/account/profile/route.ts'))
check('Account shows billing tab',               () => fileContains('src/app/(portal)/portal/account/AccountClient.tsx', 'billing'))
check('Account shows certificates tab',          () => fileContains('src/app/(portal)/portal/account/AccountClient.tsx', 'certificates'))

// ─────────────────────────────────────────────
// PHASE 12 — Certificate generator
// ─────────────────────────────────────────────
console.log('\n📋 Phase 12 — Certificate generator')

check('certificate-generator.ts exists',         () => exists('src/lib/certificates/certificate-generator.ts'))
check('certificate-generator has buildData fn',  () => fileContains('src/lib/certificates/certificate-generator.ts', 'buildCertificateData'))
check('certificate-generator has generateHtml',  () => fileContains('src/lib/certificates/certificate-generator.ts', 'generateCertificateHtml'))
check('Certificate API route exists',            () => exists('src/app/api/certificates/[courseId]/route.ts'))

// ─────────────────────────────────────────────
// PHASE 13 — Deployment
// ─────────────────────────────────────────────
console.log('\n📋 Phase 13 — Deployment')

check('DEPLOY.md exists',                        () => exists('DEPLOY.md'))
check('DEPLOY.md covers Supabase setup',         () => fileContains('DEPLOY.md', 'Supabase'))
check('DEPLOY.md covers Vercel setup',           () => fileContains('DEPLOY.md', 'Vercel'))
check('DEPLOY.md covers Payhip migration',       () => fileContains('DEPLOY.md', 'Payhip'))
check('DEPLOY.md covers payment gateway setup',  () => fileContains('DEPLOY.md', 'Stripe'))
check('prisma/seed.ts exists',                   () => exists('prisma/seed.ts'))
check('seed.ts creates admin user',              () => fileContains('prisma/seed.ts', 'ADMIN'))
check('seed.ts creates sample course',           () => fileContains('prisma/seed.ts', 'Introduction to Hermetics'))
check('seed.ts creates default gateway',         () => fileContains('prisma/seed.ts', 'paymentGateway'))
check('package.json has prisma seed config',     () => fileContains('package.json', 'prisma/seed.ts'))
check('Admin settings page exists',              () => exists('src/app/(admin)/admin/settings/page.tsx'))
check('SettingsEditor.tsx exists',               () => exists('src/app/(admin)/admin/settings/SettingsEditor.tsx'))

// ─────────────────────────────────────────────
// SALES PAGE + REVIEW SYSTEM
// ─────────────────────────────────────────────
console.log('\n📋 Sales page + review system')

// Schema models
check('SalesPagePrompts model in schema',   () => fileContains('prisma/schema.prisma', 'model SalesPagePrompts'))
check('SalesPage model in schema',          () => fileContains('prisma/schema.prisma', 'model SalesPage'))
check('SalesPageBlock model in schema',     () => fileContains('prisma/schema.prisma', 'model SalesPageBlock'))
check('CheckoutPage model in schema',       () => fileContains('prisma/schema.prisma', 'model CheckoutPage'))
check('CourseEmailSequence in schema',      () => fileContains('prisma/schema.prisma', 'model CourseEmailSequence'))
check('CourseEmailStep in schema',          () => fileContains('prisma/schema.prisma', 'model CourseEmailStep'))
check('CourseReview model in schema',       () => fileContains('prisma/schema.prisma', 'model CourseReview'))
check('Testimonial model in schema',        () => fileContains('prisma/schema.prisma', 'model Testimonial'))
check('MediaAsset model in schema',         () => fileContains('prisma/schema.prisma', 'model MediaAsset'))
check('SalesPagePrompts has editable q_*',  () => fileContains('prisma/schema.prisma', 'q_headline'))
check('CourseReview has @@unique on user+course', () => fileContains('prisma/schema.prisma', '@@unique([courseId, userId])'))
check('Course has reviewsEnabled field',    () => fileContains('prisma/schema.prisma', 'reviewsEnabled'))
check('Product has SalesPage relation',      () => fileContains('prisma/schema.prisma', 'salesPage     SalesPage?'))
check('Course has salesPrompts relation',   () => fileContains('prisma/schema.prisma', 'salesPrompts'))

// Service layer
check('createCourseDefaults exists',        () => exists('src/lib/course/course-defaults.ts'))
check('generateBlocksFromPrompts exists',   () => exists('src/lib/course/generate-blocks.ts'))
check('Blocks generated only from non-empty prompts', () => fileContains('src/lib/course/generate-blocks.ts', 'trim()'))
check('CURRICULUM block always created',    () => fileContains('src/lib/course/generate-blocks.ts', "'CURRICULUM'"))
check('HERO always created',                () => fileContains('src/lib/course/generate-blocks.ts', "'HERO'"))

// API routes
check('Prompts API route exists',           () => exists('src/app/api/courses/[courseId]/sales-page/prompts/route.ts'))
check('Blocks API route exists',            () => exists('src/app/api/courses/[courseId]/sales-page/blocks/route.ts'))
check('Reviews API route exists',           () => exists('src/app/api/courses/[courseId]/reviews/route.ts'))
check('Review moderation API exists',       () => exists('src/app/api/admin/reviews/[reviewId]/route.ts'))
check('Media upload API exists',            () => exists('src/app/api/media/route.ts'))
check('Course creation calls defaults',     () => fileContains('src/app/api/courses/route.ts', 'createCourseDefaults'))

// Admin pages
check('Sales page editor page exists',      () => exists('src/app/(admin)/admin/courses/[courseId]/sales-page/page.tsx'))
check('SalesPageEditor.tsx exists',         () => exists('src/app/(admin)/admin/courses/[courseId]/sales-page/SalesPageEditor.tsx'))
check('SalesPageEditor has PromptField',    () => fileContains('src/app/(admin)/admin/courses/[courseId]/sales-page/SalesPageEditor.tsx', 'PromptField'))
check('SalesPageEditor has BlockRow',       () => fileContains('src/app/(admin)/admin/courses/[courseId]/sales-page/SalesPageEditor.tsx', 'BlockRow'))
check('Prompt questions are editable',      () => fileContains('src/app/(admin)/admin/courses/[courseId]/sales-page/SalesPageEditor.tsx', 'edit question'))
check('Reviews admin page exists',          () => exists('src/app/(admin)/admin/reviews/page.tsx'))
check('Reviews moderation client exists',   () => exists('src/app/(admin)/admin/reviews/ReviewsModerationClient.tsx'))

// Public pages
check('Live sales page reads SalesPage',    () => fileContains('src/app/(public)/courses/[slug]/page.tsx', 'salesPage'))
check('Live page renders DB blocks',        () => fileContains('src/app/(public)/courses/[slug]/page.tsx', 'blocks.map'))
check('Live page has CourseReviews',        () => fileContains('src/app/(public)/courses/[slug]/page.tsx', 'CourseReviews'))
check('Live page has fmtDuration null-safe',() => fileContains('src/app/(public)/courses/[slug]/page.tsx', 'fmtDuration'))
check('Duration never shown if null',       () => fileContains('src/app/(public)/courses/[slug]/page.tsx', 'durationLabel &&'))

// Components
check('CourseReviews component exists',     () => exists('src/components/course/CourseReviews.tsx'))
check('CourseReviews has star rating UI',   () => fileContains('src/components/course/CourseReviews.tsx', 'Stars'))
check('CourseReviews checks isEnrolled',    () => fileContains('src/components/course/CourseReviews.tsx', 'isEnrolled'))
check('MediaPicker component exists',       () => exists('src/components/ui/MediaPicker.tsx'))
check('Admin sidebar has Reviews link',     () => fileContains('src/components/admin/AdminSidebar.tsx', "'/admin/reviews'"))
check('Course edit links to sales page',    () => fileContains('src/app/(admin)/admin/courses/[courseId]/edit/page.tsx', 'sales-page'))

// ─────────────────────────────────────────────
// STUDENT JOURNEY INTEGRITY
// ─────────────────────────────────────────────
console.log('\n🧭 Student journey integrity')

// Post-purchase flow
check('Magic link POST_PURCHASE redirects to course not portal', () => fileContains('src/app/api/auth/magic/route.ts', '/portal/courses/${firstCourse.slug}'))
check('Magic link includes course slug in redirect',             () => fileContains('src/app/api/auth/magic/route.ts', "select: { slug: true }"))
check('Checkout success copy is clear for first-timer',         () => fileContains('src/app/(public)/checkout/success/page.tsx', "You're enrolled in"))

// Standalone review page
check('Portal review page exists',                  () => exists('src/app/(portal)/portal/courses/[slug]/review/page.tsx'))
check('Portal review page checks enrollment',       () => fileContains('src/app/(portal)/portal/courses/[slug]/review/page.tsx', 'ACTIVE'))
check('Portal review page redirects unenrolled to sales page', () => fileContains('src/app/(portal)/portal/courses/[slug]/review/page.tsx', '/courses/'))
check('Portal review page has back-to-course link', () => fileContains('src/app/(portal)/portal/courses/[slug]/review/page.tsx', 'Back to course'))
check('Portal review page shows update vs new copy', () => fileContains('src/app/(portal)/portal/courses/[slug]/review/page.tsx', 'Update Your Review'))
check('Portal review page passes focusForm=true',   () => fileContains('src/app/(portal)/portal/courses/[slug]/review/page.tsx', 'focusForm={true}'))
check('CourseReviews accepts focusForm prop',        () => fileContains('src/components/course/CourseReviews.tsx', 'focusForm'))
check('CourseReviews scrolls to form on focusForm',  () => fileContains('src/components/course/CourseReviews.tsx', 'scrollIntoView'))
check('CourseReviews accepts existingRating prop',  () => fileContains('src/components/course/CourseReviews.tsx', 'existingRating'))

// Review invite email
check('sendReviewInviteEmail exists',               () => fileContains('src/lib/email/email-service.ts', 'sendReviewInviteEmail'))
check('Review invite links to /portal/courses/*/review', () => fileContains('src/lib/email/email-service.ts', '/portal/courses/${courseSlug}/review'))
check('Review invite fired on course completion',   () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/actions.ts', 'sendReviewInviteEmail'))

// Automation template variables
check('Automation engine resolves {{review_url}}',  () => fileContains('src/lib/automations/automation-engine.ts', 'review_url'))
check('Automation engine resolves {{course_url}}',  () => fileContains('src/lib/automations/automation-engine.ts', 'course_url'))
check('Automation engine resolves {{course_title}}',() => fileContains('src/lib/automations/automation-engine.ts', 'course_title'))
check('review_url points to portal review page',    () => fileContains('src/lib/automations/automation-engine.ts', '/portal/courses/'))

// Course completion UX
check('LessonPlayer has course completion banner',  () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', "You've completed"))
check('LessonPlayer has certificate link on completion', () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', '/portal/certificates'))
check('LessonPlayer has review link on completion', () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', '/review'))
check('LessonPlayer shows last lesson buttons only when marked complete', () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', '!nextLesson && completed'))

// Drip UX
check('Drip locked shows exact unlock date',        () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', 'will be available on'))
check('Drip locked has calendar reminder link',     () => fileContains('src/app/(portal)/portal/courses/[slug]/[lessonId]/LessonPlayer.tsx', 'calendar.google.com'))

// Portal course overview
check('Course overview shows certificate CTA when complete', () => fileContains('src/app/(portal)/portal/courses/[slug]/page.tsx', 'Certificate'))
check('Course overview shows review CTA when complete', () => fileContains('src/app/(portal)/portal/courses/[slug]/page.tsx', '/review'))
check('Course overview hides Start CTA when 100%',  () => fileContains('src/app/(portal)/portal/courses/[slug]/page.tsx', 'progressPct < 100'))

// Portal dashboard
check('Dashboard completed courses show review link', () => fileContains('src/app/(portal)/portal/page.tsx', '/review'))
check('Dashboard completed courses show certificate link', () => fileContains('src/app/(portal)/portal/page.tsx', 'certificates'))

// ─────────────────────────────────────────────
// PURCHASE FLOW + SCP PARITY
// ─────────────────────────────────────────────
console.log('\n🛒 Purchase flow + SCP parity')

check('Sales page buy box has Leave a Review for enrolled',  () => fileContains('src/app/(public)/courses/[slug]/page.tsx', '★ Leave a Review'))
check('Leave a Review links to /portal/courses/*/review',    () => fileContains('src/app/(public)/courses/[slug]/page.tsx', '/review'))
check('Checkout success copy is unambiguous (first-timer)',  () => fileContains('src/app/(public)/checkout/success/page.tsx', "We've sent a link"))
check('Success page Go to Course routes through login',      () => fileContains('src/app/(public)/checkout/success/page.tsx', 'login?callbackUrl'))
check('Success page has no direct /portal link (no dead end)', () => !fileContains('src/app/(public)/checkout/success/page.tsx', 'href="/portal"'))
check('ACCESS_GRANTED trigger fired on enrolment',           () => fileContains('src/lib/payments/order-service.ts', 'ACCESS_GRANTED'))
check('Automation engine documents ACCESS_GRANTED trigger',  () => fileContains('src/lib/automations/automation-engine.ts', 'ACCESS_GRANTED'))
check('Automation engine documents ACCESS_REMOVED trigger',  () => fileContains('src/lib/automations/automation-engine.ts', 'ACCESS_REMOVED'))
check('Automation engine documents template variables',      () => fileContains('src/lib/automations/automation-engine.ts', '{{review_url}}'))
check('Automation engine notes funnel-on-checkout pattern',  () => fileContains('src/lib/automations/automation-engine.ts', 'funnel'))
check('Login page auto-redirects authenticated users',       () => fileContains('src/app/(public)/login/page.tsx', "redirect(searchParams.callbackUrl"))
check('LoginForm threads callbackUrl through signIn',        () => fileContains('src/app/(public)/login/LoginForm.tsx', 'callbackUrl'))

// ─────────────────────────────────────────────
// HOMEPAGE EDITOR
// ─────────────────────────────────────────────
// HOMEPAGE EDITOR
// ─────────────────────────────────────────────
console.log('\n📋 Homepage editor')

check('Admin homepage page exists',              () => exists('src/app/(admin)/admin/homepage/page.tsx'))
check('HomepageEditor.tsx exists',               () => exists('src/app/(admin)/admin/homepage/HomepageEditor.tsx'))
check('Homepage API exists',                     () => exists('src/app/api/settings/homepage/route.ts'))
check('SiteSettings has heroHeadline',           () => fileContains('src/lib/settings/site-settings.ts', 'heroHeadline'))
check('SiteSettings has featuredCourseIds',      () => fileContains('src/lib/settings/site-settings.ts', 'featuredCourseIds'))
check('SiteSettings has homepageSections',       () => fileContains('src/lib/settings/site-settings.ts', 'homepageSections'))
check('SiteSettings has showEmailOptin',         () => fileContains('src/lib/settings/site-settings.ts', 'showEmailOptin'))
check('Homepage reads heroHeadline from DB',     () => fileContains("src/app/(public)/page.tsx", 'settings.heroHeadline'))
check('Homepage reads featuredCourseIds',        () => fileContains("src/app/(public)/page.tsx", 'featuredCourseIds'))
check('Homepage reads showEmailOptin',           () => fileContains("src/app/(public)/page.tsx", 'showEmailOptin'))
check('Homepage reads homepageSections',         () => fileContains("src/app/(public)/page.tsx", 'homepageSections'))
check('Admin sidebar has Homepage link',         () => fileContains('src/components/admin/AdminSidebar.tsx', "'/admin/homepage'"))

// ─────────────────────────────────────────────
// CROSS-CUTTING CONCERNS
// ─────────────────────────────────────────────
console.log('\n📋 Cross-cutting concerns')

check('No orphaned old portal structure',     () => noOrphanedDirectory('src/app/(portal)/courses'))
check('Middleware protects /portal path',     () => fileContains('src/middleware.ts', '/portal'))
check('Middleware protects /admin path',      () => fileContains('src/middleware.ts', '/admin'))
check('tailwind.config.js exists',           () => exists('tailwind.config.js'))
check('tsconfig.json exists',                () => exists('tsconfig.json'))
check('next.config.js exists',               () => exists('next.config.js'))
console.log('\n' + '─'.repeat(50))
// ── Collections admin ─────────────────────────────────────────────────────────
check('Admin collections list page exists',   () => exists('src/app/(admin)/admin/collections/page.tsx'))
check('Admin collections new page exists',    () => exists('src/app/(admin)/admin/collections/new/page.tsx'))
check('Admin collections edit page exists',   () => exists('src/app/(admin)/admin/collections/[collectionId]/edit/page.tsx'))
check('CollectionEditor component exists',    () => exists('src/components/admin/CollectionEditor.tsx'))
check('CollectionEditor has bannerImageUrl',  () => fileContains('src/components/admin/CollectionEditor.tsx', 'bannerImageUrl'))
check('CollectionEditor has courseIds',       () => fileContains('src/components/admin/CollectionEditor.tsx', 'courseIds'))
check('Collections POST API exists',          () => exists('src/app/api/collections/route.ts'))
check('Collections PATCH API exists',         () => exists('src/app/api/collections/[collectionId]/route.ts'))
check('/courses page shows collections grid', () => fileContains('src/app/(public)/courses/page.tsx', 'CollectionCard'))
check('/collection/[slug] alias exists',      () => exists('src/app/(public)/collection/[slug]/page.tsx'))
check('/collection listing alias exists',     () => exists('src/app/(public)/collection/page.tsx'))

// ─────────────────────────────────────────────
// PHASE — LINK INTEGRITY
// Every internal href in nav, footer, and key
// public pages must resolve to a real page file.
// ─────────────────────────────────────────────
console.log('\n🔗 Link integrity — no dead internal hrefs');

/**
 * Given a Next.js app-router href like "/collection/[slug]",
 * return true if a page.tsx exists at the matching path.
 * Dynamic segments like [slug] are treated as wildcards.
 */
function routeExists(href) {
  if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return true
  // Strip query string and hash
  const clean = href.split('?')[0].split('#')[0]
  if (!clean || clean === '/') {
    return fs.existsSync(path.join(ROOT, 'src/app/(public)/page.tsx')) ||
           fs.existsSync(path.join(ROOT, 'src/app/page.tsx'))
  }

  const segments = clean.replace(/^\//, '').split('/')
  const appDir   = path.join(ROOT, 'src/app')

  // Try resolving through (public), (portal), (admin) groups and root
  const groups = ['(public)', '(portal)', '(admin)', '']

  for (const group of groups) {
    const base = group ? path.join(appDir, group) : appDir
    if (!fs.existsSync(base)) continue

    // Walk segments, allowing [param] directories to match any segment
    function walk(dir, remaining) {
      if (remaining.length === 0) {
        return fs.existsSync(path.join(dir, 'page.tsx')) ||
               fs.existsSync(path.join(dir, 'page.jsx')) ||
               fs.existsSync(path.join(dir, 'route.ts'))
      }
      const [seg, ...rest] = remaining
      const entries = fs.existsSync(dir) ? fs.readdirSync(dir) : []
      for (const entry of entries) {
        const full = path.join(dir, entry)
        if (!fs.statSync(full).isDirectory()) continue
        // Exact match OR dynamic segment match
        if (entry === seg || /^\[.+\]$/.test(entry)) {
          if (walk(full, rest)) return true
        }
      }
      return false
    }

    if (walk(base, segments)) return true
  }
  return false
}

/**
 * Extract all href="..." and href={`/...`} and href='/...' values
 * from a source file that look like internal routes.
 */
function extractHrefs(relPath) {
  if (!exists(relPath)) return []
  const src   = fs.readFileSync(path.join(ROOT, relPath), 'utf8')
  const hrefs = []
  // href="/something" or href='/something'
  const staticRe = /href=["'](\/?[a-zA-Z][^"']*?)["']/g
  let m
  while ((m = staticRe.exec(src)) !== null) {
    const h = m[1]
    if (h.startsWith('/') && !h.startsWith('//')) hrefs.push(h)
  }
  return [...new Set(hrefs)]
}

// Files to scan for dead links
const LINK_FILES = [
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Footer.tsx',
  'src/app/(public)/page.tsx',
]

// Routes we know are external integrations, not page files
// Note: fully external hrefs (http/https) are already skipped in routeExists
const IGNORE_PREFIXES = [
  '/api/',
  '/portal',   // portal protected — checked separately
  '/admin',    // admin protected — checked separately
]

// Verify Blog link in footer is external, not a broken internal /blog
check('Footer Blog link is external (not internal /blog)', () => {
  if (!exists('src/components/layout/Footer.tsx')) return false
  const src = fs.readFileSync(path.join(ROOT, 'src/components/layout/Footer.tsx'), 'utf8')
  // Must NOT have href="/blog" (internal dead link)
  if (src.includes('href="/blog"')) return false
  // Must have the external blog URL
  return src.includes('perseusarcaneacademy.com/blog')
})

for (const file of LINK_FILES) {
  const hrefs = extractHrefs(file)
  for (const href of hrefs) {
    if (IGNORE_PREFIXES.some(p => href.startsWith(p))) continue
    check(`${file.split('/').pop()} — "${href}" resolves to a real page`, () => routeExists(href))
  }
}

// Also verify specific known-critical routes explicitly
const CRITICAL_ROUTES = [
  ['/',            'Homepage'],
  ['/courses',     'Courses catalog'],
  ['/collection',  'Collections listing'],
  ['/instructors', 'Instructors listing'],
  ['/login',       'Login page'],
  ['/privacy',     'Privacy policy'],
  ['/terms',       'Terms of service'],
  ['/cookies',     'Cookie policy'],
  ['/gdpr',        'GDPR data request'],
  ['/faq',         'FAQ'],
  ['/contact',     'Contact'],
  ['/unsubscribe', 'Unsubscribe page'],
]

for (const [route, label] of CRITICAL_ROUTES) {
  check(`Critical route exists: ${label} (${route})`, () => routeExists(route))
}

// ─────────────────────────────────────────────
// RESULT
// ─────────────────────────────────────────────
if (failures.length > 0) {
  console.log('\n❌ FAILURES:')
  failures.forEach(f => console.log('  ' + f))
}
console.log(`\n${failures.length === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed`)
console.log(failures.length === 0 ? '\nReady to zip.\n' : '\nFix failures before zipping.\n')
process.exit(failures.length > 0 ? 1 : 0)
