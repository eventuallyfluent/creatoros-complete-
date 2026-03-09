import { prisma } from '@/lib/db/prisma'

/**
 * Creates a Product (COURSE type) wrapping an existing Course,
 * plus a ProductCourse join, SalesPage, SalesPagePrompts, and
 * a default CheckoutPage — all idempotent.
 *
 * Called:
 *  - When a new course is created
 *  - During Payhip migration (one call per imported course)
 */
export async function createProductForCourse(
  courseId: string,
  opts: {
    title:         string
    subtitle?:     string | null
    slug:          string
    price:         number
    compareAtPrice?: number | null
    currency?:     string
    status?:       'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    instructorId?: string | null
    thumbnailUrl?:   string | null
    billingType?:    string
    billingInterval?:string | null
    trialDays?:      number | null
  }
): Promise<{ productId: string }> {

  // Upsert Product
  const product = await prisma.product.upsert({
    where:  { slug: opts.slug },
    create: {
      slug:          opts.slug,
      type:          'COURSE',
      status:        opts.status ?? 'DRAFT',
      title:         opts.title,
      subtitle:      opts.subtitle ?? null,
      price:         opts.price,
      compareAtPrice:opts.compareAtPrice ?? null,
      currency:      opts.currency ?? 'USD',
      instructorId:  opts.instructorId ?? null,
      thumbnailUrl:   opts.thumbnailUrl ?? null,
      billingType:    (opts.billingType as any) ?? 'ONE_TIME',
      billingInterval:(opts.billingInterval as any) ?? null,
      trialDays:      opts.trialDays ?? null,
    },
    update: {}, // don't overwrite if exists
  })

  // Upsert ProductCourse join
  await prisma.productCourse.upsert({
    where:  { productId_courseId: { productId: product.id, courseId } },
    create: { productId: product.id, courseId, sortOrder: 0 },
    update: {},
  })

  // Upsert SalesPagePrompts
  await prisma.salesPagePrompts.upsert({
    where:  { productId: product.id },
    create: { productId: product.id },
    update: {},
  })

  // Upsert SalesPage (DRAFT)
  await prisma.salesPage.upsert({
    where:  { productId: product.id },
    create: { productId: product.id, status: 'DRAFT' },
    update: {},
  })

  // Upsert default CheckoutPage
  const existing = await prisma.checkoutPage.findFirst({
    where: { productId: product.id, isDefault: true },
  })
  if (!existing) {
    await prisma.checkoutPage.create({
      data: {
        productId:        product.id,
        label:            'Default',
        isDefault:        true,
        showCouponField:  true,
        thankYouHeadline: `You're in! Welcome to ${opts.title}.`,
      },
    })
  }

  return { productId: product.id }
}

/**
 * Creates a BUNDLE product.
 * courseIds are the courses included — ProductCourse rows created for each.
 */
export async function createBundleProduct(opts: {
  slug:          string
  title:         string
  subtitle?:     string | null
  price:         number
  compareAtPrice?: number | null
  currency?:     string
  courseIds:     string[]
  instructorId?: string | null
  thumbnailUrl?: string | null
}): Promise<{ productId: string }> {

  const product = await prisma.product.upsert({
    where:  { slug: opts.slug },
    create: {
      slug:          opts.slug,
      type:          'BUNDLE',
      status:        'DRAFT',
      title:         opts.title,
      subtitle:      opts.subtitle ?? null,
      price:         opts.price,
      compareAtPrice:opts.compareAtPrice ?? null,
      currency:      opts.currency ?? 'USD',
      instructorId:  opts.instructorId ?? null,
      thumbnailUrl:  opts.thumbnailUrl ?? null,
    },
    update: {},
  })

  // Create ProductCourse joins in order
  for (let i = 0; i < opts.courseIds.length; i++) {
    await prisma.productCourse.upsert({
      where:  { productId_courseId: { productId: product.id, courseId: opts.courseIds[i] } },
      create: { productId: product.id, courseId: opts.courseIds[i], sortOrder: i },
      update: { sortOrder: i },
    })
  }

  // SalesPagePrompts with bundle-specific question labels
  await prisma.salesPagePrompts.upsert({
    where:  { productId: product.id },
    create: {
      productId: product.id,
      q_headline:         'What is the headline for this bundle?',
      q_subheadline:      'What is the supporting statement?',
      q_problem:          'What problem does this bundle solve?',
      q_whoIsItFor:       'Who is this bundle for?',
      q_benefits:         'Why get the bundle? What do you get? (one per line)',
      q_transformation:   'What is the combined transformation students experience?',
      q_whatsIncluded:    'What courses are included? What does each cover? (one per line)',
      q_curriculumSummary:'Briefly describe the overall learning journey',
      q_instructorBio:    'About the instructors or brand behind this bundle',
      q_ctaText:          'What should the call-to-action button say?',
      q_ctaSubtext:       'What savings or value statement goes below the button?',
    },
    update: {},
  })

  await prisma.salesPage.upsert({
    where:  { productId: product.id },
    create: { productId: product.id, status: 'DRAFT' },
    update: {},
  })

  const existing = await prisma.checkoutPage.findFirst({
    where: { productId: product.id, isDefault: true },
  })
  if (!existing) {
    await prisma.checkoutPage.create({
      data: {
        productId:        product.id,
        label:            'Default',
        isDefault:        true,
        showCouponField:  true,
        thankYouHeadline: `You're in! Welcome to ${opts.title}.`,
      },
    })
  }

  return { productId: product.id }
}
