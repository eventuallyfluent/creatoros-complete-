# CreatorOS — Deployment Guide
## Perseus Arcane Academy · Vercel + Supabase

---

## Prerequisites

- Node.js 20+
- A Supabase account (free tier works for 500 members)
- A Vercel account (free tier works)
- A Resend account (free tier: 3,000 emails/month)

---

## Step 1 — Supabase Setup

### 1.1 Create a new project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name: `creatoros` (or your preferred name)
3. Database password: generate a strong one and save it
4. Region: choose nearest to your students (Singapore or Tokyo for Asia-Pacific)
5. Click **Create new project** — wait ~2 minutes

### 1.2 Get your database URLs

In Supabase dashboard → **Settings → Database**:

- **Connection string (Transaction mode)** → copy as `DATABASE_URL`
  - Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Connection string (Session mode)** → copy as `DIRECT_URL`
  - Format: `postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

### 1.3 Create storage bucket

In Supabase dashboard → **Storage → New bucket**:

- Name: `creatoros`
- Public: **Yes** (so uploaded images have public URLs)
- Click **Save**

Then → **Policies → New policy** for the `creatoros` bucket:
- Allow authenticated users to INSERT
- Allow public to SELECT

### 1.4 Get Supabase API keys

In Supabase dashboard → **Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL (e.g. `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (keep secret)

---

## Step 2 — Resend Setup

1. Go to [resend.com](https://resend.com) → Sign up
2. **Domains → Add domain** → add `perseusarcaneacademy.com`
3. Follow DNS verification steps (add TXT + MX records in your DNS provider)
4. Once verified: **API Keys → Create API Key** → copy as `RESEND_API_KEY`
5. Set `EMAIL_FROM` to: `Perseus Arcane Academy <noreply@perseusarcaneacademy.com>`

### Resend webhook (for bounce handling)

1. In Resend → **Webhooks → Add endpoint**
2. URL: `https://course.perseusarcaneacademy.com/api/webhooks/resend`
3. Events: select `email.bounced`, `email.complained`

---

## Step 3 — Run Database Migrations

```bash
# Clone/unzip the project
cd creatoros

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Fill in all values in .env.local

# Run migrations (creates all tables)
npx prisma migrate deploy

# Seed initial data (admin user, sample course, default gateway)
npx prisma db seed
```

After seeding, note the admin email printed in the console.

---

## Step 4 — Deploy to Vercel

### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial CreatorOS build"
git remote add origin https://github.com/YOUR_USERNAME/creatoros.git
git push -u origin main
```

### 4.2 Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Click **Environment Variables** → add all variables from `.env.local`

Required environment variables:

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL=https://course.perseusarcaneacademy.com
NEXTAUTH_SECRET          # generate: openssl rand -base64 32
RESEND_API_KEY
EMAIL_FROM
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://course.perseusarcaneacademy.com
NEXT_PUBLIC_APP_NAME=Perseus Arcane Academy
```

5. Click **Deploy**

### 4.3 Custom domain

In Vercel → your project → **Settings → Domains**:

1. Add `course.perseusarcaneacademy.com`
2. In your DNS provider, add:
   - `CNAME course → cname.vercel-dns.com`
3. Wait for SSL certificate (~2 minutes)

---

## Step 5 — Post-Deploy Checklist

```
□ Visit https://course.perseusarcaneacademy.com — homepage loads
□ Go to /login → send magic link to admin email → check inbox
□ Click magic link → lands on /portal
□ Visit /admin → see admin dashboard
□ Admin → Courses → confirm sample course exists
□ Admin → Payments → confirm Manual gateway is default
□ Admin → Branding → upload your logo
□ Admin → Settings → set your site name and colours
□ Visit /courses → confirm sample course appears
□ Test checkout: add to cart, select Manual gateway, confirm pending order
□ Admin → Orders → find the pending order → Mark as Paid → student enrolled
□ Check email: post-purchase magic link arrives
□ Students can access /portal/courses/introduction-to-hermetics
```

---

## Step 6 — Migrate Existing Students from Payhip

1. In Payhip: **Dashboard → Sales → Export CSV**
2. In CreatorOS admin: **Students → Import CSV**
3. Drop the Payhip CSV → auto-detects email column
4. Select which course to enrol them in (optional)
5. Click **Import** → accounts created, no login emails sent
6. Students can log in at `/login` with their existing email via magic link

---

## Step 7 — Connect Your Payment Gateway

### Manual / Bank Transfer (default — already active)

- Students select "Bank Transfer" at checkout
- Order goes to PENDING state
- Admin manually marks as paid after bank confirmation
- Student receives access email automatically

### Adding Stripe (when ready)

1. Admin → **Payments → Add Payment Gateway → Stripe**
2. Enter your Stripe Publishable Key and Secret Key
3. In Stripe Dashboard → Webhooks → Add endpoint:
   - URL: `https://course.perseusarcaneacademy.com/api/webhooks/[YOUR-GATEWAY-ID]`
   - Events: `payment_intent.succeeded`, `charge.refunded`
4. Copy webhook signing secret → paste into CreatorOS gateway config

### Adding Crypto (NOWPayments)

1. Create account at [nowpayments.io](https://nowpayments.io)
2. Admin → **Payments → Add → NOWPayments**
3. Enter API key and IPN secret
4. In NOWPayments dashboard set IPN URL to the webhook URL shown in CreatorOS

---

## Ongoing Operations

### Scale reference

| Students | Supabase plan | Vercel plan | Monthly cost |
|---|---|---|---|
| 0–500 | Free | Hobby (Free) | $0 |
| 500–2,000 | Pro ($25/mo) | Hobby | $25 |
| 2,000–10,000 | Pro | Pro ($20/mo) | $45 |
| 10,000+ | Pro + add-ons | Pro | $70+ |

### Useful commands

```bash
# Pull latest schema from production DB
npx prisma db pull

# Generate Prisma client after schema changes
npx prisma generate

# Open Prisma Studio (local DB browser)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your-migration-name

# Apply migrations to production
npx prisma migrate deploy
```

### Environment variables for local development

```bash
cp .env.example .env.local
# Fill in values, then:
npm run dev
# App runs at http://localhost:3000
```

---

## Architecture Summary

```
course.perseusarcaneacademy.com
    │
    ▼
Vercel Edge Network (global CDN)
    │
    ▼
Next.js 14 App Router
    ├── / (public site)          ← (public) route group
    ├── /portal/**               ← (portal) route group — auth required
    ├── /admin/**                ← (admin) route group — ADMIN role required
    └── /api/**                  ← API routes
         ├── /auth               ← NextAuth magic link
         ├── /orders             ← order creation + webhook handlers
         ├── /webhooks/[id]      ← universal payment webhook
         ├── /webhooks/resend    ← email bounce/complaint handler
         ├── /emails             ← broadcast + test send
         ├── /certificates       ← PDF cert generation
         └── /gateways           ← payment gateway CRUD
    │
    ▼
Supabase (Postgres + Storage)
    ├── postgres DB (Prisma ORM)
    └── storage bucket: creatoros (thumbnails, logos, uploads)
    │
    ▼
External services
    ├── Resend (transactional + broadcast email)
    ├── Streamable / Vimeo / YouTube (video hosting)
    └── Stripe / PayPal / NOWPayments (payment gateways — plug in when ready)
```
