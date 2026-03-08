# CreatorOS Native Email Engine — Future Build Spec

**Status:** Not started. Planned for post-launch Phase 2.
**Reference:** Smart Creator Press (SCP) autoresponder + broadcast system.
**Decision date:** March 2026

---

## Why Build This

EmailOctopus works for basic newsletter broadcasts but has a hard cap on automations.
As Perseus Arcane Academy grows, you need email sequences that fire automatically from
platform events — purchase, enrolment, course completion, inactivity — without paying
a per-contact ESP fee or hitting automation limits.

SCP proves this is fully buildable in-platform. We build the same thing in CreatorOS,
sending via Resend (or any SMTP), with zero external ESP dependency for sequences.

---

## Architecture Overview

### Email Job Queue (DB-driven scheduler)
New Prisma model `EmailJob`:
- recipient email, name, userId
- subject, bodyHtml
- scheduledAt (datetime)
- status: PENDING | SENDING | SENT | FAILED
- attempts (int, max 3)
- sequenceId? (FK to sequence)
- broadcastId? (FK to broadcast)

A Next.js cron route `/api/cron/email-queue` runs every 5 minutes via Vercel Cron.
It fetches all PENDING jobs where scheduledAt <= now, sends via Resend, marks SENT or FAILED.

### Sending Provider: Resend
- `npm install resend`
- Single env var: `RESEND_API_KEY`
- Clean React Email templates for all transactional + sequence emails
- Free tier: 3,000 emails/month — enough to start

---

## Feature 1: Autoresponder (Sequences)

**What it does:** Multi-step email drip triggered by a platform event.

### Triggers (match SCP)
| Trigger | Implementation |
|---------|----------------|
| User purchases a product | `afterCheckout()` hook in `/api/checkout/complete` |
| User enrols in a course | `afterEnrolment()` hook |
| User completes a course | `onCourseComplete()` in lesson progress API |
| User completes a lesson | `onLessonComplete()` in lesson progress API |
| User loses access (expired) | Nightly cron checks access_end_date |
| Tag added to user | `onTagAdded()` hook in tag API |

### DB Models
```prisma
model EmailSequence {
  id          String   @id @default(cuid())
  name        String
  trigger     String   // PURCHASE | ENROLMENT | COURSE_COMPLETE | LESSON_COMPLETE | TAG_ADDED | ACCESS_EXPIRED
  triggerRef  String?  // productId or courseId or lessonId or tag name
  status      String   @default("DRAFT") // DRAFT | PUBLISHED
  steps       EmailSequenceStep[]
  createdAt   DateTime @default(now())
}

model EmailSequenceStep {
  id           String        @id @default(cuid())
  sequenceId   String
  sequence     EmailSequence @relation(fields: [sequenceId], references: [id])
  position     Int
  subject      String
  bodyHtml     String        @db.Text
  delayDays    Int           @default(0)
  delayHours   Int           @default(0)
  sendAtTime   String?       // "09:00" in site timezone
  rules        Json?         // delivery conditions (has/doesn't have product, etc.)
}
```

### Admin UI: `/admin/sequences`
- List all sequences (name, trigger, steps count, status, enable/disable toggle)
- Create/edit sequence → builder:
  - Step 1: Choose trigger + source (which product/course/tag)
  - Step 2: Add email steps with delay and delivery rules
  - Step 3: Publish

### Delivery Rules (per step — match SCP)
Each step can have conditions that must pass before the email sends:
- Has access to [product]
- Does NOT have access to [product]
- No additional rules

---

## Feature 2: Broadcasts

**What it does:** One-off email to a filtered segment of your members/subscribers.

### DB Model
```prisma
model EmailBroadcast {
  id           String    @id @default(cuid())
  name         String
  subject      String
  bodyHtml     String    @db.Text
  preheader    String?
  fromName     String?
  fromEmail    String?
  status       String    @default("DRAFT") // DRAFT | SCHEDULED | SENDING | SENT
  scheduledAt  DateTime?
  sentAt       DateTime?
  recipientCount Int     @default(0)
  sentCount    Int       @default(0)
  failedCount  Int       @default(0)
  rules        Json      // AND/OR segment rules
  createdAt    DateTime  @default(now())
}
```

### Segment Rule Builder (AND/OR — match SCP exactly)
Rules stored as JSON. OR groups, AND conditions within each group.

**Available filters:**
| Filter | Logic |
|--------|-------|
| All users | Everyone in EmailSubscriber table |
| Has purchased [product] | Order exists with status COMPLETED |
| Has NOT purchased [product] | No completed order for product |
| Has active enrolment in [course] | Enrolment.status = ACTIVE |
| Completed [course] | CourseProgress.completed = true |
| Not logged in for X days | User.lastLoginAt < now - X days |
| Subscriber tag = [tag] | EmailSubscriber.tags contains tag |
| Subscriber source = [source] | EmailSubscriber.source = value |
| Enrolment expires in X days | Enrolment.accessEndDate between now and now+X |

### Admin UI: `/admin/broadcasts`
Three tabs: Drafts | Scheduled | Sent

Create broadcast flow (3 steps matching SCP):
1. **Compose** — subject, body (rich text), preheader, from name/email
2. **Audience** — visual AND/OR rule builder, live preview of estimated recipient count
3. **Schedule** — Send Now | Send Later (date/time/timezone) | Save Draft

Batch sending: configurable per-hour limit (default 500/hr) to respect Resend limits.

---

## Feature 3: Email Templates

Rich email composer using **React Email** components:
- Branded header with Perseus logo
- Consistent footer with unsubscribe link
- Merge tags: `{{first_name}}`, `{{email}}`, `{{course_name}}`, `{{login_link}}`
- Auto-insert unsubscribe link (required by CAN-SPAM / GDPR)

---

## Feature 4: Unsubscribe Handling

Already partially built. Extend:
- Every sent email contains unique unsubscribe token (stored in EmailJob)
- `/unsubscribe?token=xxx` → sets EmailSubscriber.status = UNSUBSCRIBED, EmailJob shows as opted-out
- Honor unsubscribe in all future sends (filter out UNSUBSCRIBED before job creation)
- GDPR data request page (`/gdpr`) → export or delete subscriber record

---

## Feature 5: Email Logs & Stats

Admin → Email → Logs:
- Per-job log: recipient, sequence/broadcast, subject, scheduled, sent, status
- Per-broadcast stats: sent, failed, (open/click if Resend webhooks configured)
- Per-sequence stats: total triggered, total sent, completion rate per step

---

## What Stays with EmailOctopus

After this is built, EmailOctopus becomes optional:
- **Keep it** for cold marketing newsletters to leads who never purchased
- **Or drop it** entirely and manage everything from CreatorOS

Footer signups will continue to sync to EmailOctopus AND the CreatorOS DB.
The `syncToEmailOctopus()` function in `/src/lib/email/email-octopus.ts` handles this.
To switch to Kit or Brevo, just replace that file — the subscriber API doesn't change.

---

## Build Order (when ready)

1. `EmailJob`, `EmailSequence`, `EmailSequenceStep`, `EmailBroadcast` Prisma models
2. Resend integration (`/src/lib/email/resend.ts`) + React Email base template
3. Email job queue cron (`/api/cron/email-queue`)
4. Sequence trigger hooks wired into checkout, enrolment, progress APIs
5. Admin sequence builder UI (`/admin/sequences`)
6. Admin broadcast composer UI (`/admin/broadcasts`)
7. Unsubscribe token flow
8. Email logs admin view

**Estimated scope:** 2-3 build sessions (~200 files)

---

## Env Vars Needed (future)

```env
# Resend (replaces need for SMTP)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM_NAME="Perseus Arcane Academy"
EMAIL_FROM_ADDRESS=hello@perseusarcaneacademy.com

# Vercel Cron secret (protect /api/cron/* routes)
CRON_SECRET=your_random_secret_here
```

---

*Spec written March 2026. Build when live revenue justifies the investment.*
