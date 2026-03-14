# PROJECT.md — CreatorOS Build Truth + Execution Protocol

This file exists to stop wasted tokens, broken assumptions, and random edits.

If an AI agent touches this repo, it must treat this file as the operational contract.
Read `RULES.md` first. Then read this file.

---

## 1) What this project actually is

CreatorOS is a multi-surface LMS platform:

- Next.js 14 app router
- Prisma + Postgres (Supabase, ap-southeast-1)
- Public storefront, student portal, admin CMS
- Product layer on top of course content
- Payment gateway abstraction (Stripe, Creem, Generic API, Webhook-only, Manual)
- Automation engine, email sequences, analytics

### Current state (updated after P0 sweep)

~211 TS/TSX files, 69 page routes, 57 API handlers.

Schema drift sweep **completed**. The six most dangerous drift issues are fixed.
Remaining type errors are cosmetic (missing `children` props) or false positives
from running tsc without node_modules installed.

---

## 2) Non-negotiable architectural truths

### Truth 1 — Course = content. Product = commerce.

Price, currency, checkout, sales pages, order items, coupons — all on **Product**.
Course has: title, slug, modules, lessons, instructor, status. Nothing else.

### Truth 2 — Hosted payment only.

No inline card collection. All payments go through a hosted checkout URL.

### Truth 3 — Schema is law.

`prisma/schema.prisma` wins over all docs, comments, and memory.

### Truth 4 — Gateway interface is a contract.

`src/lib/payments/gateway-driver.ts` defines `PaymentEvent`, `RefundPayload`, `OrderPayload`.
Every driver must conform exactly. Do not warp the app around a broken driver.

### Truth 5 — Minimal diffs beat clever refactors.

---

## 3) Known fixed issues (P0 sweep — March 2026)

| File | What was wrong | Fix |
|---|---|---|
| `prisma/seed.ts` | Wrote `Course.price`, `Course.currency`, `Module.slug`, `Lesson.slug` — none exist | Removed, restructured to explicit create calls |
| `src/lib/analytics/analytics-service.ts` | `OrderItem.courseId` doesn't exist — used `groupBy courseId` | Joined via `ProductCourse`, typed groupBy results |
| `src/lib/payments/gateway-registry.ts` | `findUnique({ where: { id, isActive } })` — invalid Prisma | Changed to `findFirst` |
| `src/app/api/webhooks/[gatewayId]/route.ts` | Same `findUnique`/`isActive` bug | Changed to `findFirst` |
| `src/app/api/admin/import/route.ts` | Wrote `price`/`currency` to Course; bad CsvRow cast; MapIterator spread | Fixed all three |
| `src/lib/payments/drivers/stripe.ts` | `handleWebhook` returned `{ type, orderId, gatewayRef }` not `PaymentEvent`; `issueRefund` wrong signature | Fixed to match interface exactly |
| `src/app/(public)/checkout/[slug]/page.tsx` | `findUnique` with non-unique `status` field | Changed to `findFirst` |
| `src/app/(portal)/portal/courses/[slug]/[lessonId]/page.tsx` | `.catch(() => [])` killed type of `progressRecords` | Explicit type annotation |
| `src/app/(admin)/admin/students/[studentId]/page.tsx` | `progressMap` typed as `Map<unknown,{}>`, duplicate `fontSize` | Explicit `Map<string,number>` |
| `src/components/admin/GatewayManager.tsx` | `'api_driver'` not in `mode` union | Added to union |
| `src/app/(admin)/admin/coupons/[couponId]/edit/page.tsx` | Fetched `courses` but passed as `products` | Fixed to fetch `products` |
| `src/app/(portal)/portal/certificates/page.tsx` | Duplicate `background` property | Removed duplicate |
| `src/app/(portal)/portal/page.tsx` | `[...new Set()]` spread without downlevelIteration | `Array.from(new Set())` |
| `src/app/(public)/checkout/[slug]/CheckoutForm.tsx` | `guaranteeText` used but not in `CheckoutPageData` interface | Added to interface |
| `src/components/video/VideoPlayer.tsx` | `data.data?.duration` typed as `{}` | Cast to `any` |
| `src/lib/email/email-service.ts` | `results` array inferred as `never[]` | Typed as `unknown[]` |
| `src/app/(public)/instructors/page.tsx` | `onClick` in server component | Removed |
| `src/app/(public)/page.tsx` | Queried `testimonial` model (may not exist) | Migrated to `courseReview` |

---

## 4) Remaining known issues (P1)

### Still to fix

1. **Auth hardening** — admin credentials are hardcoded in `auth-options.ts`. Move to env vars.
2. **billingType/billingInterval/trialDays** — UI captures these but DB columns don't exist. Fields not persisted.
3. **Resend domain** — `perseusarcaneacademy.com` DNS records not verified. Email sends from `onboarding@resend.dev`.
4. **EmailOctopus** — API key and List ID not set in Vercel env vars.
5. **Student CSV import** — page exists but not fully wired end-to-end.
6. **No CI/test suite** — all verification is manual.

### Cosmetic type errors (don't affect runtime or build)

These appear when running `tsc --noEmit` locally without `node_modules` installed.
They resolve correctly when `npm install` has run (as in Vercel builds):
- `children` missing on `Button`, `Badge`, `FooterLink`, `ColHeading` etc.
- `Cannot find module 'next'`, `react`, `lucide-react` etc.
- `Buffer` not found in payment drivers

---

## 5) Mandatory session start protocol

Before writing any code:

1. Read `RULES.md`
2. Read this `PROJECT.md`  
3. Read `prisma/schema.prisma`
4. Read the **full** target file(s)
5. Grep for every usage of the model/route/function being changed
6. State the exact invariant being preserved
7. Only then edit

If touching payments, also read:
- `src/lib/payments/gateway-driver.ts`
- `src/lib/payments/gateway-registry.ts`
- Affected driver file(s)
- `src/app/api/orders/route.ts`
- `src/app/api/webhooks/[gatewayId]/route.ts`

---

## 6) Forbidden behaviors

1. Editing a file before reading the whole file
2. Using a field name because it "sounds right"
3. Treating docs/comments as more trustworthy than schema/code
4. `findUnique` with non-unique fields — always use `findFirst` when filtering by non-`@unique` columns
5. Writing `price`, `currency`, `compareAtPrice` to `Course` — these live on `Product`
6. Writing `courseId` to `OrderItem` — it has `productId`
7. Writing `slug` to `Module` or `Lesson` — these fields don't exist in schema
8. `[...iterator]` spread — use `Array.from()` for Sets and Map iterators

---

## 7) Canonical files by concern

### Schema / truth
- `prisma/schema.prisma`

### Auth
- `src/lib/auth/auth-options.ts`
- `src/middleware.ts`

### Orders / checkout / payments
- `src/app/api/orders/route.ts`
- `src/app/api/webhooks/[gatewayId]/route.ts`
- `src/lib/payments/gateway-driver.ts`
- `src/lib/payments/gateway-registry.ts`
- `src/lib/payments/order-service.ts`
- `src/lib/payments/drivers/*`

### Course/Product relationship
- `src/lib/course/course-defaults.ts`
- `src/lib/product/product-defaults.ts`

### Settings / CMS
- `src/lib/settings/site-settings.ts`
- `src/app/api/settings/*`
