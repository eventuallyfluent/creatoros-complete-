/**
 * Sales page block content types.
 * These describe the shape of SalesPageBlock.content (Json field in Prisma).
 * The authoritative model definitions are in schema.prisma.
 */

export type BlockContentMap = {
  HERO:         HeroContent
  TEXT:         TextContent
  IMAGE:        ImageContent
  BENEFITS:     BenefitsContent
  CURRICULUM:   CurriculumContent
  INSTRUCTOR:   InstructorContent
  TESTIMONIALS: TestimonialsContent
  FAQ:          FaqContent
  CTA:          CtaContent
  DIVIDER:      DividerContent
}

export interface HeroContent {
  headline:    string
  subheadline: string
  ctaLabel:    string
  ctaSubtext:  string
  badgeLabels: string[]
}

export interface TextContent {
  heading?: string
  body:     string
  align:    'left' | 'center'
}

export interface ImageContent {
  altText?:  string
  caption?:  string
  linkUrl?:  string
}

export interface BenefitsContent {
  heading: string
  items:   string[]
}

export interface CurriculumContent {
  heading:         string
  showLessonCount: boolean
  showDurations:   boolean
  showFreePreview: boolean
  expandFirst:     boolean
}

export interface InstructorContent {
  heading:     string
  showAvatar:  boolean
  showBio:     boolean
  bioOverride: string | null
}

export interface TestimonialsContent {
  heading:          string
  pullFromApproved: boolean // auto-populate from approved Testimonial records
  items:            { name: string; quote: string; role?: string }[] // manual items
}

export interface FaqContent {
  heading: string
  items:   { question: string; answer: string }[]
}

export interface CtaContent {
  heading?:      string
  buttonLabel:   string
  buttonSubtext: string
}

export interface DividerContent {
  symbol?: string
}

export type AnyBlockContent = BlockContentMap[keyof BlockContentMap]

export function blockContent<T extends keyof BlockContentMap>(raw: any): BlockContentMap[T] {
  return raw as BlockContentMap[T]
}
