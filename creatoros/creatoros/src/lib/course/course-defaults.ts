import { prisma } from '@/lib/db/prisma'
import { generateBlocksFromPrompts } from './generate-blocks'
import { createProductForCourse } from '@/lib/product/product-defaults'

/**
 * Called whenever a new course is created.
 * - Creates the Product wrapper + ProductCourse join
 * - Creates SalesPage, SalesPagePrompts, CheckoutPage on the Product
 * - Creates the CourseEmailSequence on the Course
 * All operations are idempotent.
 */
export async function createCourseDefaults(
  courseId: string,
  opts: {
    title:          string
    slug:           string
    price?:         number
    compareAtPrice?: number | null
    currency?:      string
    status?:        'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    instructorId?:  string | null
    thumbnailUrl?:  string | null
    subtitle?:      string | null
  }
): Promise<{ productId: string }> {
  const [{ productId }] = await Promise.all([
    createProductForCourse(courseId, {
      title:          opts.title,
      slug:           opts.slug,
      price:          opts.price ?? 0,
      compareAtPrice: opts.compareAtPrice ?? null,
      currency:       opts.currency ?? 'USD',
      status:         opts.status ?? 'DRAFT',
      instructorId:   opts.instructorId ?? null,
      thumbnailUrl:   opts.thumbnailUrl ?? null,
      subtitle:       opts.subtitle ?? null,
    }),
    prisma.courseEmailSequence.upsert({
      where:  { courseId },
      create: { courseId, isActive: true },
      update: {},
    }),
  ])
  return { productId }
}

/**
 * Regenerates sales page blocks from the Product's prompt answers.
 * Called explicitly when admin clicks "Generate Sales Page".
 */
export async function generateSalesPageFromPrompts(productId: string): Promise<void> {
  const [prompts, salesPage, product] = await Promise.all([
    prisma.salesPagePrompts.findUnique({ where: { productId } }),
    prisma.salesPage.findUnique({ where: { productId } }),
    prisma.product.findUnique({
      where:   { id: productId },
      include: {
        instructor: true,
        courses: { take: 1, include: { course: { select: { thumbnailUrl: true } } } },
      },
    }),
  ])

  if (!prompts || !salesPage || !product) {
    throw new Error(`Product ${productId} missing required records`)
  }

  const thumbnailUrl = product.thumbnailUrl
    ?? (product as any).courses?.[0]?.course?.thumbnailUrl
    ?? null

  const blocks = generateBlocksFromPrompts(prompts, {
    title:       product.title,
    subtitle:    product.subtitle,
    instructor:  product.instructor,
    thumbnailUrl,
  })

  await prisma.salesPageBlock.deleteMany({ where: { salesPageId: salesPage.id } })
  await prisma.salesPageBlock.createMany({
    data: blocks.map((b, i) => ({
      salesPageId: salesPage.id,
      type:        b.type,
      sortOrder:   i,
      visible:     true,
      content:     b.content,
    })),
  })

  await prisma.salesPage.update({
    where: { id: salesPage.id },
    data:  { generatedFromPrompts: true, lastGeneratedAt: new Date() },
  })
}
