/**
 * CreatorOS — Database Seed Script
 * Run with: npx prisma db seed
 *
 * Creates:
 *   1. Admin user account
 *   2. Default site settings
 *   3. Sample instructor profile
 *   4. One sample published course with modules + lessons
 *   5. Default payment gateway (Manual / Bank Transfer)
 *
 * Usage:
 *   DATABASE_URL="..." npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@perseusarcaneacademy.com'

async function main() {
  console.log('🌱 Seeding CreatorOS database…\n')

  // ── 1. Admin user ────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: ADMIN_EMAIL },
    update: { role: 'ADMIN' },
    create: {
      email:         ADMIN_EMAIL,
      role:          'ADMIN',
      emailVerified: new Date(),
      name:          'Admin',
    },
  })
  console.log(`✓ Admin user: ${admin.email}`)

  // ── 2. Site settings ─────────────────────────────────────
  await prisma.siteSetting.upsert({
    where:  { key: 'site_config' },
    create: {
      key:   'site_config',
      value: {
        siteName:        'Perseus Arcane Academy',
        tagline:         'Master the Mysteries',
        primaryColor:    '#7B2FBE',
        accentColor:     '#C084FC',
        footerText:      '© Perseus Arcane Academy. All rights reserved.',
        metaTitle:       'Perseus Arcane Academy — Master the Mysteries',
        metaDescription: 'Premium occult and esoteric education.',
        socialLinks:     {},
        headerNav: [
          { label: 'Courses',     href: '/courses'     },
          { label: 'Collections', href: '/collections' },
          { label: 'Instructors', href: '/instructors' },
        ],
        footerNav: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Use',   href: '/terms'   },
          { label: 'Contact',        href: '/contact' },
        ],
      },
      group: 'BRANDING',
    },
    update: {},
  })
  console.log('✓ Site settings')

  // ── 3. Instructor profile ─────────────────────────────────
  const instructor = await prisma.instructorProfile.upsert({
    where:  { userId: admin.id },
    create: {
      userId:      admin.id,
      displayName: 'Perseus',
      slug:        'perseus',
      bio:         'Founder of Perseus Arcane Academy. Practitioner and teacher of Western esoteric traditions for over two decades.',
    },
    update: {},
  })
  console.log(`✓ Instructor: ${instructor.displayName}`)

  // ── 4. Sample course ──────────────────────────────────────
  const existing = await prisma.course.findUnique({ where: { slug: 'introduction-to-hermetics' } })
  if (!existing) {
    const course = await prisma.course.create({
      data: {
        title:        'Introduction to Hermetics',
        slug:         'introduction-to-hermetics',
        subtitle:     'The foundational principles of Western esoteric philosophy',
        description:  'Begin your journey into Hermetic philosophy with this comprehensive introduction.',
        status:       'PUBLISHED',
        instructorId: instructor.id,
      },
    })

    const mod1 = await prisma.module.create({ data: { courseId: course.id, title: 'The Hermetic Foundation', sortOrder: 0, isPublished: true } })
    await prisma.lesson.createMany({ data: [
      { moduleId: mod1.id, courseId: course.id, title: 'Welcome & Course Overview',    type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo1', sortOrder: 0, isPublished: true, isFree: true,  duration: 480  },
      { moduleId: mod1.id, courseId: course.id, title: 'What is Hermeticism?',          type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo2', sortOrder: 1, isPublished: true, isFree: false, duration: 1440 },
      { moduleId: mod1.id, courseId: course.id, title: 'The Kybalion — Text & Context', type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo3', sortOrder: 2, isPublished: true, isFree: false, duration: 2160 },
    ]})

    const mod2 = await prisma.module.create({ data: { courseId: course.id, title: 'The Seven Principles', sortOrder: 1, isPublished: true } })
    await prisma.lesson.createMany({ data: [
      { moduleId: mod2.id, courseId: course.id, title: 'Mentalism — All is Mind',            type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo4', sortOrder: 0, isPublished: true, duration: 1800 },
      { moduleId: mod2.id, courseId: course.id, title: 'Correspondence — As Above So Below', type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo5', sortOrder: 1, isPublished: true, duration: 1620 },
      { moduleId: mod2.id, courseId: course.id, title: 'Vibration — Everything Moves',       type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo6', sortOrder: 2, isPublished: true, duration: 1440 },
      { moduleId: mod2.id, courseId: course.id, title: 'Polarity, Rhythm & Causation',       type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo7', sortOrder: 3, isPublished: true, duration: 2400 },
      { moduleId: mod2.id, courseId: course.id, title: 'Gender — The Creative Principle',    type: 'VIDEO', videoProvider: 'STREAMABLE', videoId: 'demo8', sortOrder: 4, isPublished: true, duration: 1260 },
    ]})
    console.log(`✓ Sample course: "${course.title}"`)
  } else {
    console.log(`ℹ  Sample course already exists — skipping`)
  }

  // ── 5. Default payment gateway ────────────────────────────
  const gwCount = await prisma.paymentGateway.count()
  if (gwCount === 0) {
    await prisma.paymentGateway.create({
      data: {
        name:      'Manual / Bank Transfer',
        provider:  'manual',
        isActive:  true,
        isDefault: true,
        config:    {},
      },
    })
    console.log('✓ Default payment gateway: Manual / Bank Transfer')
  } else {
    console.log('ℹ  Payment gateways already exist — skipping')
  }

  console.log('\n✅ Seed complete!')
  console.log(`\n   Admin login: ${ADMIN_EMAIL}`)
  console.log('   Send magic link from /login to access admin panel\n')
}

main()
  .catch(err => { console.error('Seed failed:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
