# CreatorOS — Perseus Arcane Academy

Replacing Payhip. Full LMS + course commerce platform.

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Prisma** + **PostgreSQL** (Supabase)
- **NextAuth.js** (magic link primary)
- **Resend** (transactional email)
- **Tailwind CSS** (design system tokens)
- **Vercel** (deployment)

---

## Setup — First Time

### 1. Clone and install
```bash
git clone <your-repo>
cd creatoros
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
- `DATABASE_URL` — from Supabase project settings
- `DIRECT_URL` — from Supabase project settings  
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `RESEND_API_KEY` — from resend.com (free tier)

### 3. Push database schema
```bash
npm run db:push
```

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo at vercel.com
3. Add all env variables from `.env.local`
4. Deploy

Point `course.perseusarcaneacademy.com` to Vercel:
- Add CNAME record in Siteground: `course` → `cname.vercel-dns.com`

---

## Migrating from Payhip

### Export from Payhip
1. Payhip Dashboard → Members → Export CSV
2. Payhip Dashboard → Products → export course list

### Import to CreatorOS
```bash
# Import students (creates accounts, no emails sent yet)
npm run db:seed -- --file=students.csv

# Or use Admin → Students → Import CSV
```

---

## Build Phases

- [x] Phase 1 — Foundation (this)
- [ ] Phase 2 — Storefront & Collections
- [ ] Phase 3 — Auth flow complete
- [ ] Phase 4 — Course Builder admin
- [ ] Phase 5 — Sales & Checkout pages
- [ ] Phase 6 — Payment Gateway Engine
- [ ] Phase 7 — Course Player
- [ ] Phase 8 — Library & Comments
- [ ] Phase 9 — Commerce (upsells, refunds)
- [ ] Phase 10 — Automations & Webhooks
- [ ] Phase 11 — Analytics & Admin panel
- [ ] Phase 12 — Certificates & Polish
