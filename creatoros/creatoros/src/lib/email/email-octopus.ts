/**
 * EmailOctopus provider adapter
 *
 * Syncs new subscribers to EmailOctopus via API v1.6.
 * Fire-and-forget: failures are logged but never block the user flow.
 *
 * Env vars required:
 *   EMAIL_OCTOPUS_API_KEY   — from EmailOctopus → Account → API Keys
 *   EMAIL_OCTOPUS_LIST_ID   — from EmailOctopus → Contacts → your list → Settings
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FUTURE: When replacing EmailOctopus with another provider (Kit, Brevo, etc.),
 * create a new file e.g. src/lib/email/kit.ts with the same exported signature:
 *
 *   export async function syncToEmailProvider(params: EmailSyncParams): Promise<void>
 *
 * Then update the import in src/app/api/subscribers/route.ts — nothing else changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface EmailSyncParams {
  email: string
  name?: string | null
  source?: string | null
  tags?: string[]
}

/**
 * Add or update a contact in the EmailOctopus list.
 * Uses POST (create) with a try/catch — if contact already exists, EO returns 409
 * and we do a silent PATCH to update status to SUBSCRIBED.
 */
export async function syncToEmailOctopus(params: EmailSyncParams): Promise<void> {
  const apiKey = process.env.EMAIL_OCTOPUS_API_KEY
  const listId = process.env.EMAIL_OCTOPUS_LIST_ID

  // Silently skip if not configured — dev environments, etc.
  if (!apiKey || !listId) return

  const { email, name, tags = [] } = params

  // Parse first/last name if provided
  const [firstName, ...rest] = (name ?? '').trim().split(' ')
  const lastName = rest.join(' ')

  const payload: Record<string, unknown> = {
    api_key:       apiKey,
    email_address: email,
    status:        'SUBSCRIBED',
    fields: {
      ...(firstName && { FirstName: firstName }),
      ...(lastName  && { LastName:  lastName  }),
    },
    ...(tags.length > 0 && { tags }),
  }

  const base = `https://emailoctopus.com/api/1.6/lists/${listId}/contacts`

  const res = await fetch(base, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })

  // 200/201 = success
  if (res.ok) return

  // 409 = contact already exists — update to ensure SUBSCRIBED status
  if (res.status === 409) {
    const memberId = emailToMemberId(email)
    await fetch(`${base}/${memberId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        api_key: apiKey,
        status:  'SUBSCRIBED',
      }),
    })
    return
  }

  // Any other error — log for debugging, don't throw
  const body = await res.text().catch(() => '')
  console.error(`[EmailOctopus] sync failed ${res.status}:`, body)
}

/**
 * EmailOctopus accepts an MD5 hash of the lowercased email as a contact ID.
 * We compute this client-side to avoid a lookup round-trip on 409.
 */
function emailToMemberId(email: string): string {
  // Node crypto md5
  const { createHash } = require('crypto')
  return createHash('md5').update(email.toLowerCase().trim()).digest('hex')
}
