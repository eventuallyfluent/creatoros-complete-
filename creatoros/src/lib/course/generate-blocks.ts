import type { SalesPagePrompts } from '@prisma/client'

type BlockType = 'HERO' | 'TEXT' | 'BENEFITS' | 'CURRICULUM' | 'INSTRUCTOR' | 'TESTIMONIALS' | 'FAQ' | 'CTA' | 'DIVIDER' | 'IMAGE'

interface GeneratedBlock {
  type:    BlockType
  content: Record<string, any>
}

function splitLines(text: string): string[] {
  return text
    .split(/\n|(?:\s*-\s+)/)
    .map(s => s.replace(/^[-•*✓✦]\s*/, '').trim())
    .filter(s => s.length > 2)
}

export function generateBlocksFromPrompts(
  prompts: SalesPagePrompts,
  course: { title: string; subtitle?: string | null; instructor?: { displayName: string } | null }
): GeneratedBlock[] {
  const blocks: GeneratedBlock[] = []

  // ── HERO ─────────────────────────────────────────────────────────────────
  blocks.push({
    type: 'HERO',
    content: {
      headline:    prompts.headline    || course.title,
      subheadline: prompts.subheadline || course.subtitle || '',
      ctaLabel:    prompts.ctaText     || 'Enrol Now',
      ctaSubtext:  prompts.ctaSubtext  || '',
      badgeLabels: [],
    },
  })

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  blocks.push({ type: 'DIVIDER', content: { symbol: '✦' } })

  // ── WHO IT'S FOR / PROBLEM ────────────────────────────────────────────────
  if (prompts.problem?.trim() || prompts.whoIsItFor?.trim()) {
    const parts: string[] = []
    if (prompts.problem?.trim())    parts.push(prompts.problem.trim())
    if (prompts.whoIsItFor?.trim()) parts.push(prompts.whoIsItFor.trim())
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Who Is This For?',
        body:    parts.join('\n\n'),
        align:   'left',
      },
    })
  }

  // ── BENEFITS ─────────────────────────────────────────────────────────────
  if (prompts.benefits?.trim()) {
    const items = splitLines(prompts.benefits)
    if (items.length > 0) {
      blocks.push({
        type: 'BENEFITS',
        content: { heading: 'What You Will Learn', items },
      })
    }
  }

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  blocks.push({ type: 'DIVIDER', content: { symbol: '✦' } })

  // ── CURRICULUM ───────────────────────────────────────────────────────────
  blocks.push({
    type: 'CURRICULUM',
    content: {
      heading:         'Course Content',
      showLessonCount: true,
      showDurations:   true,
      showFreePreview: true,
      expandFirst:     true,
    },
  })

  // ── WHAT'S INCLUDED ──────────────────────────────────────────────────────
  if (prompts.whatsIncluded?.trim()) {
    const items = splitLines(prompts.whatsIncluded)
    if (items.length > 0) {
      blocks.push({
        type: 'BENEFITS',
        content: { heading: "What's Included", items },
      })
    }
  }

  // ── TRANSFORMATION ───────────────────────────────────────────────────────
  if (prompts.transformation?.trim()) {
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Your Outcome',
        body:    prompts.transformation.trim(),
        align:   'center',
      },
    })
  }

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  blocks.push({ type: 'DIVIDER', content: { symbol: '✦' } })

  // ── INSTRUCTOR ───────────────────────────────────────────────────────────
  if (course.instructor) {
    blocks.push({
      type: 'INSTRUCTOR',
      content: {
        heading:     'Your Instructor',
        showAvatar:  true,
        showBio:     true,
        bioOverride: prompts.instructorBio?.trim() || null,
      },
    })
  }

  // ── TESTIMONIALS ─────────────────────────────────────────────────────────
  blocks.push({
    type: 'TESTIMONIALS',
    content: {
      heading:          'What Students Say',
      items:            [],
      pullFromApproved: true,
    },
  })

  // ── CTA ──────────────────────────────────────────────────────────────────
  blocks.push({
    type: 'CTA',
    content: {
      heading:       'Ready to Begin?',
      buttonLabel:   prompts.ctaText    || 'Enrol Now',
      buttonSubtext: prompts.ctaSubtext || '',
      showPrice:     true,
    },
  })

  return blocks
}
