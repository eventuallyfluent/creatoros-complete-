import type { SalesPagePrompts } from '@prisma/client'

type BlockType = 'HERO' | 'TEXT' | 'BENEFITS' | 'CURRICULUM' | 'INSTRUCTOR' | 'TESTIMONIALS' | 'FAQ' | 'CTA' | 'DIVIDER' | 'IMAGE'

interface GeneratedBlock {
  type:    BlockType
  content: Record<string, any>
}

function splitLines(text: string): string[] {
  return text
    // Split on newlines, or on " - " / " – " dash separators
    .split(/\n|\r|(?:\s+[-–]\s+)/)
    .map(s => s.replace(/^[-–•*✓✦\s]+/, '').trim())
    .filter(s => s.length > 2)
}

export function generateBlocksFromPrompts(
  prompts: SalesPagePrompts,
  course: { title: string; subtitle?: string | null; instructor?: { displayName: string } | null }
): GeneratedBlock[] {
  const blocks: GeneratedBlock[] = []

  // ── HERO ─────────────────────────────────────────────────────────────────
  // Rich hero with badges from benefits list
  const benefitItems   = prompts.benefits?.trim()      ? splitLines(prompts.benefits)      : []
  const includedItems  = prompts.whatsIncluded?.trim()  ? splitLines(prompts.whatsIncluded)  : []
  // Use up to 3 short benefit phrases as hero badges
  const badgeCandidates = [...benefitItems, ...includedItems]
    .filter(b => b.length < 50)
    .slice(0, 3)

  blocks.push({
    type: 'HERO',
    content: {
      headline:    prompts.headline    || course.title,
      subheadline: prompts.subheadline || course.subtitle || '',
      ctaLabel:    prompts.ctaText     || 'Enrol Now',
      ctaSubtext:  prompts.ctaSubtext  || '',
      badgeLabels: badgeCandidates,
    },
  })

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  blocks.push({ type: 'DIVIDER', content: { symbol: '✦' } })

  // ── PROBLEM + WHO IT'S FOR — split into separate blocks for better layout
  if (prompts.problem?.trim()) {
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Does This Sound Familiar?',
        body:    prompts.problem.trim(),
        align:   'center',
      },
    })
  }

  if (prompts.whoIsItFor?.trim()) {
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Who Is This For?',
        body:    prompts.whoIsItFor.trim(),
        align:   'left',
      },
    })
  }

  // ── BENEFITS ─────────────────────────────────────────────────────────────
  if (benefitItems.length > 0) {
    blocks.push({
      type: 'BENEFITS',
      content: { heading: 'What You Will Learn', items: benefitItems },
    })
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

  // ── CURRICULUM ───────────────────────────────────────────────────────────
  if (prompts.curriculumSummary?.trim()) {
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Inside the Course',
        body:    prompts.curriculumSummary.trim(),
        align:   'left',
      },
    })
  }

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
  if (includedItems.length > 0) {
    blocks.push({
      type: 'BENEFITS',
      content: { heading: "What's Included", items: includedItems },
    })
  }

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  blocks.push({ type: 'DIVIDER', content: { symbol: '✦' } })

  // ── INSTRUCTOR ───────────────────────────────────────────────────────────
  if (course.instructor || prompts.instructorBio?.trim()) {
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

  // ── TESTIMONIALS — only if likely to have reviews ────────────────────────
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
