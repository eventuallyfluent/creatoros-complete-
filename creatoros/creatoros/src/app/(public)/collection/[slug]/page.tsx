// Canonical URL alias: /collection/[slug] → /collections/[slug]
// The live Perseus site uses the singular form.
// Both routes render identically; this one simply re-exports the same page.
export { default, generateMetadata } from '@/app/(public)/collections/[slug]/page'
