# RULES.md — Claude's Mandatory Protocol for CreatorOS
# Read this FIRST. Before touching any file. Before writing any code.
# These rules exist because I made every one of these mistakes at least once.

---

## RULE 0 — READ BEFORE TOUCHING

Before editing any file:
1. `cat` or `view` the ENTIRE file
2. Explain (even just to myself) what it currently does
3. Identify exactly which lines need to change and why
4. Only then write the edit

If I skip step 1-3 and jump straight to editing, I will break something that was already working.
This happened repeatedly — the sales page 404, the optin field names, the ManualGatewayDriver config, the registry not passing config.

---

## RULE 1 — DATA MODEL: PRODUCT vs COURSE

**SalesPage and SalesPagePrompts belong to PRODUCT, not Course.**

Course → ProductCourse → Product → SalesPage / SalesPagePrompts

- Course has NO salesPage field
- Course has NO salesPrompts field
- Course has NO salesPageData field
- NEVER query `course.salesPage` or `course.salesPageData` — they don't exist

When starting from a courseId and needing sales page data:
```
prisma.productCourse.findFirst({ where: { courseId }, include: { product: { include: { salesPage: true } } } })
```

---

## RULE 2 — PAYMENT GATEWAYS: THE PLATFORM NEVER TOUCHES CARD DATA

**CreatorOS is the platform. Payment providers are the processors.**

The flow is ALWAYS:
1. Student fills in email/name on CreatorOS checkout form
2. CreatorOS calls provider API → gets back a redirect URL
3. Student is redirected to provider's hosted payment page
4. Student enters card details ON THE PROVIDER'S PAGE — never on ours
5. Provider fires a webhook to `/api/webhooks/[gatewayId]`
6. CreatorOS verifies signature, marks order paid, enrols student

**We never build a card input form. We never store card details. Ever.**
**The onus for PCI compliance, card storage, and fraud is entirely on the provider.**

This is not a performance choice — it is the architecture. Do not deviate from it.

---

## RULE 3 — GATEWAY DRIVER INTERFACE IS THE CONTRACT

Every gateway implements `GatewayDriver` from `gateway-driver.ts`:
- `createPaymentSession(order)` → returns `{ redirectUrl, sessionId }`
- `handleWebhook(payload, headers)` → returns `PaymentEvent | null`
- `verifySignature(payload, headers, secret)` → returns boolean
- `issueRefund(payload)` → returns `{ success, refundId? }`
- `getPaymentStatus(gatewayOrderId)` → returns status string

The webhook handler at `/api/webhooks/[gatewayId]/route.ts` is already written and already correct.
The orders route at `/api/orders/route.ts` is already correct.
**Adding a new gateway requires ONLY: a new driver file + one line in gateway-registry.ts.**
Zero changes to webhook handler, orders route, or checkout form.

---

## RULE 4 — CHECK SCHEMA.PRISMA BEFORE ASSUMING ANY FIELD EXISTS

Before writing any Prisma query, check the schema for:
- Does the field actually exist on this model?
- What is the exact field name (camelCase in Prisma, may differ in DB with @map)?
- What are the relations? Which side holds the foreign key?

The q_ column disaster (session 6) happened because I wrote queries using field names that existed
in one version of the schema but had since been renamed. Always check first.

---

## RULE 5 — NEVER ASSUME WHAT'S REGISTERED OR IMPORTED

Before writing code that calls a function or uses a class, check:
- Is it imported in the file I'm editing?
- Is it registered in the registry (gateway-registry.ts, etc.)?
- Is the package installed in package.json?

The ManualGatewayDriver was called without config being passed because I assumed the registry
was passing it — it wasn't. The fix was one line but it took a whole session to diagnose.

---

## RULE 6 — FIELD NAMES MUST MATCH THE ACTUAL STATE SHAPE

When adding UI that reads from a form/state object, grep the file for the actual state keys
before using them. Do NOT invent field names that "look right."

The optin preview broke because I used `form.showOptin`, `form.optinHeadline` etc. but the actual
state fields were `form.showEmailOptin`, `form.emailOptinHeadline`. Entirely avoidable.

---

## RULE 7 — SUPABASE SERVICE ROLE KEY FORMAT

Use the modern `sb_secret_...` key format. This is a new platform — do not build on legacy anything.
package.json already specifies `supabase-js ^2.47.0` which supports the modern key format.

Get it from: Supabase Dashboard → Settings → API Keys (the default tab, not the Legacy tab).

Do NOT suggest the legacy `eyJ...` key as a workaround. If the modern key isn't working,
the problem is the supabase-js version — fix that, don't downgrade the key format.

---

## RULE 8 — PRISMA camelCase vs DB snake_case

Prisma maps camelCase field names to snake_case DB columns by default.
If the DB was created with camelCase column names (e.g. from running schema.sql manually),
you MUST add `@map("camelCaseName")` to tell Prisma the actual column name.

Without @map, Prisma looks for `q_who_is_it_for` but the DB has `q_whoIsItFor`. Query fails.

---

## RULE 9 — DON'T FIX THE SYMPTOM, UNDERSTAND THE SYSTEM

When something is broken, the workflow is:
1. Read the error message completely
2. Read ALL files involved in the flow (not just the one that errored)
3. Identify the root cause
4. Fix the root cause — not the error message

The sales page 404 (session 6) was misdiagnosed twice before the actual cause was found:
Course has no salesPage relation. The error was on the query, but the root cause was a
misunderstanding of the data model.

---

## RULE 10 — THIS PROJECT'S ARCHITECTURE IS CORRECT

The architecture was planned well. When something breaks it is almost always:
- A query using a wrong field name
- A missing import or registration
- A wrong assumption about what a function returns
- A config not being passed through

It is NOT an architecture problem. Do not refactor working systems to fix broken ones.

---

## MANDATORY SESSION START CHECKLIST

At the start of every session:
- [ ] Read this file
- [ ] Re-read the session summary at the top of the conversation
- [ ] Before any edit: `cat` the target file, explain what it does, then change the minimum

At the end of every session:
- [ ] Zip to /mnt/user-data/outputs/creatoros-complete.zip
- [ ] Confirm build would pass (grep for obvious TypeScript errors)

---

*Last updated: Session 7 — based on real mistakes made in sessions 1-6.*


## MANDATORY SESSION START — FILE INTEGRITY CHECK

Before writing a single line of code, run this exact check:

```bash
# 1. Verify no duplicate route exists
find src/app -name "page.tsx" | sed 's|/page.tsx||' | sed 's|(admin)/||;s|(public)/||;s|(portal)/||' | sort | uniq -d

# 2. Verify the known bad folder is gone
ls src/app/\(admin\)/admin-login 2>/dev/null && echo "STOP — DELETE THIS FOLDER BEFORE PROCEEDING" || echo "clean"
```

If the duplicate check returns ANY output, stop and fix it before doing anything else.
If the admin-login check returns anything other than "clean", delete the folder immediately and regenerate the zip.

## THE ADMIN-LOGIN RULE

`src/app/(public)/admin-login/` is the ONE AND ONLY admin login location.
`src/app/(admin)/admin-login/` must NEVER exist. Ever.

If at any point you create, copy, or move files related to admin-login, verify afterward:
```bash
ls src/app/\(admin\)/admin-login 2>/dev/null && echo "BUG" || echo "OK"
```

If it says BUG, delete it before packaging. No exceptions.

## ZIP PACKAGING CHECKLIST

Before running the zip command, verify:
1. No duplicate routes: `find src/app -name "page.tsx" | sed 's|/page.tsx||' | sed 's|(admin)/||;s|(public)/||;s|(portal)/||' | sort | uniq -d`
2. No (admin)/admin-login: `ls src/app/\(admin\)/admin-login 2>/dev/null || echo "clean"`
3. Build-breaking files removed

Do not package until both checks pass.
