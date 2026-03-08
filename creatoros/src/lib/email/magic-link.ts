import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface MagicLinkEmailProps {
  email: string
  url:   string
  type:  'LOGIN' | 'POST_PURCHASE'
  courseName?: string
}

export async function sendMagicLinkEmail({
  email, url, type, courseName,
}: MagicLinkEmailProps) {
  const isPostPurchase = type === 'POST_PURCHASE'

  const subject = isPostPurchase
    ? `Access your course — ${courseName ?? 'Perseus Arcane Academy'}`
    : 'Your magic link — Perseus Arcane Academy'

  const heading = isPostPurchase
    ? `Your course is ready`
    : `Sign in to Perseus Arcane Academy`

  const body = isPostPurchase
    ? `Thank you for your purchase. Click the button below to access <strong>${courseName}</strong> immediately. This link expires in 24 hours.`
    : `Click the button below to sign in. No password needed. This link expires in 15 minutes.`

  const buttonText = isPostPurchase ? 'Access My Course Now' : 'Sign In'

  await resend.emails.send({
    from:    process.env.EMAIL_FROM!,
    to:      email,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1A1A2E;border-radius:14px;border:1px solid #2E2E4E;overflow:hidden;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #2E2E4E;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png"
                   alt="Perseus Arcane Academy"
                   height="48"
                   style="height:48px;width:auto;">
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="font-size:24px;font-weight:700;color:#F0EAF8;margin:0 0 16px;line-height:1.3;">
                ${heading}
              </h1>
              <p style="font-size:15px;color:#A78BCA;line-height:1.7;margin:0 0 32px;">
                ${body}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${url}"
                       style="display:inline-block;background:#7B2FBE;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">
                      ${buttonText} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback URL -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="font-size:12px;color:#6B5B8A;line-height:1.6;margin:0;">
                If the button doesn't work, paste this link into your browser:<br>
                <a href="${url}" style="color:#C084FC;word-break:break-all;">${url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2E2E4E;">
              <p style="font-size:12px;color:#6B5B8A;margin:0;text-align:center;">
                Perseus Arcane Academy · course.perseusarcaneacademy.com<br>
                If you didn't request this email, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })
}

// Post-purchase magic link — sent after successful payment
// 24hr expiry, redirects straight to the course player
export async function sendPostPurchaseMagicLink({
  email,
  courseName,
  courseSlug,
  orderId,
}: {
  email:       string
  courseName:  string
  courseSlug:  string
  orderId:     string
}) {
  const { prisma } = await import('@/lib/db/prisma')
  const crypto     = await import('crypto')

  const token    = crypto.randomBytes(32).toString('hex')
  const expires  = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const redirect = `/portal/courses/${courseSlug}`

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
      type:     'POST_PURCHASE',
      metadata: { orderId, redirectTo: redirect },
    },
  })

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic?token=${token}&email=${encodeURIComponent(email)}`

  await sendMagicLinkEmail({ email, url, type: 'POST_PURCHASE', courseName })
}
