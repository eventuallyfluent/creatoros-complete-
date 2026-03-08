import type { SalesPagePrompts } from '@prisma/client'

type BlockType = 'HERO' | 'TEXT' | 'BENEFITS' | 'CURRICULUM' | 'INSTRUCTOR' | 'TESTIMONIALS' | 'FAQ' | 'CTA' | 'DIVIDER' | 'IMAGE'

interface GeneratedBlock {
  type:    BlockType
  content: Record<string, any>
}

/**
 * Converts filled-in prompt answers into a default block layout.
 * Only generates blocks for prompts that have answers.
 * Empty prompts = block not created (never shows placeholder text on live page).
 */
export function generateBlocksFromPrompts(
  prompts: SalesPagePrompts,
  course: { title: string; subtitle?: string | null; instructor?: { displayName: string } | null }
): GeneratedBlock[] {
  const blocks: GeneratedBlock[] = []

  // ── HERO ───────────────────────────────────────────────
  // Always created — falls back to course title if prompts empty
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

  // ── PROBLEM / WHO IT'S FOR ────────────────────────────
  if (prompts.problem?.trim() || prompts.whoIsItFor?.trim()) {
    const bodyParts: string[] = []
    if (prompts.problem?.trim())    bodyParts.push(prompts.problem.trim())
    if (prompts.whoIsItFor?.trim()) bodyParts.push(`\n${prompts.whoIsItFor.trim()}`)
    blocks.push({
      type: 'TEXT',
      content: {
        heading: prompts.whoIsItFor?.trim() ? 'Who Is This For?' : 'About This Course',
        body:    bodyParts.join('\n'),
        align:   'left',
      },
    })
  }

  // ── BENEFITS ─────────────────────────────────────────
  if (prompts.benefits?.trim()) {
    const items = prompts.benefits
      .split('\n')
      .map(s => s.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
    if (items.length > 0) {
      blocks.push({
        type: 'BENEFITS',
        content: {
          heading: 'What You Will Get',
          items,
        },
      })
    }
  }

  // ── TRANSFORMATION ───────────────────────────────────
  if (prompts.transformation?.trim()) {
    blocks.push({
      type: 'TEXT',
      content: {
        heading: 'Your Outcome',
        body:    prompts.transformation.trim(),
        align:   'left',
      },
    })
  }

  // ── CURRICULUM ───────────────────────────────────────
  // Always added — shows actual modules/lessons from DB
  blocks.push({
    type: 'CURRICULUM',
    content: {
      heading:          prompts.curriculumSummary?.trim()
                          ? prompts.curriculumSummary.trim()
                          : 'Course Content',
      showLessonCount:  true,
      showDurations:    true,  // auto-hides if no duration data exists
      showFreePreview:  true,
      expandFirst:      true,
    },
  })

  // ── WHAT'S INCLUDED ──────────────────────────────────
  if (prompts.whatsIncluded?.trim()) {
    const items = prompts.whatsIncluded
      .split('\n')
      .map(s => s.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean)
    if (items.length > 0) {
      blocks.push({
        type: 'BENEFITS',
        content: {
          heading: "What's Included",
          items,
        },
      })
    }
  }

  // ── INSTRUCTOR ───────────────────────────────────────
  // Only if course has an instructor assigned
  if (course.instructor) {
    blocks.push({
      type: 'INSTRUCTOR',
      content: {
        heading:          'Your Instructor',
        showAvatar:       true,
        showBio:          true,
        // instructorBio from prompts can override the profile bio
        bioOverride:      prompts.instructorBio?.trim() || null,
      },
    })
  }

  // ── TESTIMONIALS ─────────────────────────────────────
  // Always add (empty until testimonials are approved and added)
  blocks.push({
    type: 'TESTIMONIALS',
    content: {
      heading: 'What Students Say',
      items:   [],
      // Populated from approved Testimonial records in the renderer
      pullFromApproved: true,
    },
  })

  // ── CTA ──────────────────────────────────────────────
  blocks.push({
    type: 'CTA',
    content: {
      heading:       prompts.transformation?.trim()
                       ? `Ready to ${prompts.ctaText?.trim() ? '' : 'get started'}?`
                       : '',
      buttonLabel:   prompts.ctaText    || 'Enrol Now',
      buttonSubtext: prompts.ctaSubtext || '',
    },
  })

  return blocks
}
