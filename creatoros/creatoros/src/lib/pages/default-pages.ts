/**
 * Default content for system pages.
 * Used by the DB seed / first-run setup to populate the pages table.
 * Admins can edit these via /admin/pages.
 */
export const DEFAULT_PAGES = [
  {
    slug:   'privacy',
    title:  'Privacy Policy',
    status: 'PUBLISHED',
    type:   'STATIC',
    metaTitle: 'Privacy Policy — Perseus Arcane Academy',
    body: `# Privacy Policy

Last updated: 2025

## 1. Who We Are

Perseus Arcane Academy ("we", "us", "our") operates the online learning platform at this website. We are committed to protecting your personal data and your right to privacy.

## 2. What Data We Collect

We collect the following personal data when you use our platform:

- **Account data:** your email address and name when you register or purchase a course.
- **Purchase data:** order history, products purchased, and payment confirmation (we do not store card details — payments are processed by Stripe).
- **Usage data:** lesson progress, completion status, and course activity.
- **Communications:** emails you send us, support enquiries, and review submissions.

## 3. How We Use Your Data

We use your data to:

- Provide access to courses you have purchased.
- Send transactional emails (login links, purchase confirmations, course access).
- Send marketing emails — only if you have explicitly opted in.
- Improve the platform and course content.
- Comply with our legal obligations.

## 4. Legal Basis for Processing (GDPR)

If you are in the EEA or UK, we process your data on the following legal bases: **contract** (to deliver courses you purchased), **legitimate interests** (platform security, fraud prevention), and **consent** (marketing emails — withdrawable at any time).

## 5. Data Sharing

We do not sell your personal data. We share it only with:

- **Stripe** — payment processing.
- **Our email provider** — for transactional and marketing emails.
- **Hosting providers** — for platform infrastructure.

All processors are required to handle your data in compliance with applicable law.

## 6. Data Retention

We retain your account and purchase data for as long as your account is active and for 7 years thereafter for legal and accounting purposes. You may request deletion at any time (see section 8).

## 7. Cookies

We use strictly necessary cookies for authentication (keeping you logged in). We do not use advertising or tracking cookies.

## 8. Your Rights

You have the right to: access the data we hold about you, correct inaccurate data, request deletion, object to processing, and data portability. To exercise any of these rights, email us at privacy@perseusarcaneacademy.com.

## 9. Contact

For privacy enquiries: privacy@perseusarcaneacademy.com`,
  },
  {
    slug:   'terms',
    title:  'Terms of Service',
    status: 'PUBLISHED',
    type:   'STATIC',
    metaTitle: 'Terms of Service — Perseus Arcane Academy',
    body: `# Terms of Service

Last updated: 2025

## 1. Acceptance

By accessing or purchasing from Perseus Arcane Academy you agree to these Terms. If you do not agree, do not use the platform.

## 2. Access & Licencing

Upon successful payment you are granted a personal, non-transferable, non-exclusive licence to access the purchased course content. You may not share login credentials, redistribute content, or re-sell access to any course materials.

## 3. Payments & Refunds

All prices are shown in the listed currency. Payment is processed securely via Stripe. If you are unsatisfied with a course, please contact us within 14 days of purchase to request a refund. Refunds are issued at our discretion.

## 4. Intellectual Property

All course content — including video, audio, text, and downloadable materials — is the intellectual property of Perseus Arcane Academy or the respective instructor. Unauthorised copying, recording, or redistribution is strictly prohibited.

## 5. Acceptable Use

You agree not to: attempt to circumvent access controls, scrape or download course content in bulk, use the platform for any unlawful purpose, or harass other users or instructors.

## 6. Disclaimers

Course content is provided for educational purposes only. Results vary and are not guaranteed. Nothing on this platform constitutes medical, legal, or financial advice.

## 7. Limitation of Liability

To the fullest extent permitted by law, Perseus Arcane Academy shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.

## 8. Contact

Questions about these Terms: legal@perseusarcaneacademy.com`,
  },
  {
    slug:   'cookies',
    title:  'Cookie Policy',
    status: 'PUBLISHED',
    type:   'STATIC',
    metaTitle: 'Cookie Policy — Perseus Arcane Academy',
    body: `# Cookie Policy

## What Are Cookies

Cookies are small text files stored on your device when you visit a website.

## Cookies We Use

We use only **strictly necessary cookies**:

- **Session cookie** — keeps you logged in while you browse. Deleted when you close your browser.
- **Auth token** — remembers your login across sessions if you choose "stay logged in". Expires after 30 days.

We do **not** use advertising cookies, tracking pixels, or any third-party analytics cookies.

## Managing Cookies

You can clear cookies at any time through your browser settings. Clearing the auth cookie will log you out of the platform.

## Contact

Questions about cookies: privacy@perseusarcaneacademy.com`,
  },
  {
    slug:   'gdpr',
    title:  'GDPR Data Request',
    status: 'PUBLISHED',
    type:   'STATIC',
    metaTitle: 'GDPR Data Request — Perseus Arcane Academy',
    body: `# GDPR Data Request

Under the General Data Protection Regulation (GDPR) and UK GDPR, you have the right to:

- **Access** — request a copy of all personal data we hold about you.
- **Rectification** — request correction of inaccurate data.
- **Erasure** — request deletion of your personal data ("right to be forgotten").
- **Restriction** — request that we limit how we process your data.
- **Portability** — receive your data in a structured, machine-readable format.
- **Object** — object to processing based on legitimate interests.

## How to Submit a Request

Email **privacy@perseusarcaneacademy.com** with the subject line "GDPR Data Request" and include:

- Your full name
- The email address associated with your account
- The type of request (access, deletion, etc.)

We will respond within **30 days**.

## Identity Verification

To protect your data, we may ask you to verify your identity before fulfilling a request.

## Contact

Data Protection enquiries: privacy@perseusarcaneacademy.com`,
  },
  {
    slug:   'contact',
    title:  'Contact',
    status: 'PUBLISHED',
    type:   'STATIC',
    metaTitle: 'Contact — Perseus Arcane Academy',
    body: `# Contact Us

We'd love to hear from you.

## General Enquiries

**hello@perseusarcaneacademy.com**

## Technical Support

If you're having trouble accessing a course or logging in, email **support@perseusarcaneacademy.com** and include your order number if you have one. We typically respond within 1–2 business days.

## Partnerships & Instructor Enquiries

**partners@perseusarcaneacademy.com`
  },
  {
    slug:      'faq',
    title:     'Frequently Asked Questions',
    status:    'PUBLISHED',
    type:      'STATIC',
    metaTitle: 'FAQ — Perseus Arcane Academy',
    body: `# Frequently Asked Questions

## Courses & Access

**How do I access my course after purchasing?**
After purchase you'll receive an email with a magic login link. Click it and you'll be taken directly to your course. No password needed — every login uses a secure link sent to your email.

**Do I need to create an account before buying?**
No. Your account is created automatically when you complete your first purchase using your email address.

**How long do I have access to a course?**
All courses come with lifetime access. Once you purchase, the content is yours to revisit whenever you like.

**Can I access courses on mobile?**
Yes. The platform works on any device — desktop, tablet, or mobile.

---

## Payments & Refunds

**What payment methods do you accept?**
We accept all major credit and debit cards via Stripe. Payment is secure and your card details are never stored on our servers.

**What is your refund policy?**
If you are unsatisfied with a course, contact us within 14 days of purchase at support@perseusarcaneacademy.com. Refunds are reviewed on a case-by-case basis.

**Do you offer payment plans?**
For higher-value courses and bundles, payment plan options may be available. Contact us to discuss.

---

## Technical

**I didn't receive my login email. What do I do?**
Check your spam or junk folder first. If it's not there, go to the login page and request a new link using your email address. If you still have trouble, email support@perseusarcaneacademy.com.

**Can I download videos to watch offline?**
Videos are streamed for security reasons and cannot be downloaded. You need an internet connection to watch course content.

**The video isn't playing. What should I try?**
Try refreshing the page, clearing your browser cache, or switching to a different browser. If the issue persists, contact support with the course name and the device you're using.

---

## Other

**I have a question not listed here.**
Email us at hello@perseusarcaneacademy.com and we'll get back to you within 1–2 business days.`,
  },
]
