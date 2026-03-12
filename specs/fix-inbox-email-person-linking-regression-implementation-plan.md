# Fix Inbox email→Person linking regression — Implementation plan

## Input

- Feature spec: `C:\Users\owner\Desktop\unify-memorial-mason-main\specs\fix-inbox-email-person-linking-regression.md`
- Plan artifacts dir: `C:\Users\owner\Desktop\unify-memorial-mason-main\specs\fix-inbox-email-person-linking-regression-plan\`

## Technical context (from request)

- Regression: **email** conversations in Unified Inbox no longer link to People/Customers by email address.
- Desired: automatic linking restored for **existing** and **newly ingested/synced** email conversations.
- Constraints: minimal/targeted; don’t break WhatsApp; don’t auto-create People; preserve existing links.

---

## Current implementation findings (as-is)

### Source of truth fields

- **Conversation-level**: `public.inbox_conversations.primary_handle` is the canonical “counterparty handle”.
  - For email it is expected to be the external party’s **email address**.
  - For SMS/WhatsApp it is expected to be an E.164-ish phone/WA identifier.
- **Person-level**: `public.customers.email` is used for email matching (People/Customers appear to live in `customers`).

### Where linking currently happens (backend)

- **Gmail ingestion (Edge Function)**: `supabase/functions/inbox-gmail-sync/index.ts`
  - Derives `primaryHandle` from Gmail headers:
    - `direction = fromEmail === userEmail ? 'outbound' : 'inbound'`
    - `primaryHandle = inbound ? fromEmail : toEmail`
  - Calls `attemptAutoLink(..., channel="email", primaryHandle)`
  - `attemptAutoLink`:
    - trims; lowercases for email
    - matches against `customers.email` using `ilike` (case-insensitive exact match, no wildcards)
    - sets `inbox_conversations.person_id` + `link_state` + `link_meta` when exactly one match.

- **Twilio inbound (Edge Function)**: `supabase/functions/twilio-sms-webhook/index.ts`
  - Has a similar `attemptAutoLink`, but uses `.eq(customers.email, primaryHandle)` when `channel === 'email'`.
  - This path is not expected for email in normal operation (but it indicates linking logic is duplicated and inconsistent).

### Where linking is missing / incomplete (backend)

- **Outbound “new thread” creation (Edge Function)**: `supabase/functions/inbox-gmail-new-thread/index.ts`
  - Creates `inbox_conversations` with `primary_handle = trimmedTo`, but does **not** attempt to set `person_id`.
  - This means email conversations created via “send first email / new thread” can remain unlinked even when the email matches an existing customer.

### Where linking is used (frontend)

- Frontend expects `conversation.person_id` to be populated:
  - `src/modules/inbox/components/ConversationView.tsx` loads person context via `useCustomer(conversation?.person_id ?? '')`
  - orders/invoices context is fetched by person id (no email fallback).
  - Net: if `person_id` is null, Inbox shows “Not linked” and no related context.

### Existing backfill tooling already exists (DB)

- Migration exists: `supabase/migrations/20260304130000_inbox_customers_email_link_backfill.sql`
  - Adds index `customers_email_lower_idx` and backfills `inbox_conversations` by
    - `lower(trim(c.primary_handle)) = lower(trim(cust.email))`
  - This will **not** link conversations where `primary_handle` is not a bare email address.

---

## Root cause (most likely, to verify during implementation)

**Primary cause**: `primary_handle` for email conversations is no longer reliably a single, bare external email address.

Concrete breakpoints observed:
- Gmail “To” header parsing uses a simplistic `extractEmail()` that:
  - only extracts a single `<...>` match, otherwise returns the whole header string
  - does not handle multiple recipients (comma-separated)
- For outbound messages `primary_handle` is set to `toEmail`, which may become:
  - `"a@b.com, c@d.com"` (multiple recipients)
  - a group address / alias
  - an address that includes the workshop’s own mailbox in some compositions
- Downstream matching is an “exact match” (even if case-insensitive), so any of the above shapes prevents matching `customers.email`.

**Secondary cause** (confirmed): outbound new-thread creation does not attempt auto-link at all, so newly created email conversations can remain unlinked indefinitely.

---

## Recommended source of truth for email matching

### Canonical email for a conversation

For `channel='email'`, define **conversation canonical email** as:
- A **single, bare email** (not `Name <...>`, not a list)
- The **external party** in the thread:
  - inbound: sender (`From`)
  - outbound: first recipient in `To` that is not the user/workshop email (fall back to first `To` if needed)

### Person field(s)

- Match against `public.customers.email`.
- Matching rule:
  - normalize both sides: `lower(trim(email))`
  - match only when exactly one customer row matches (avoid auto-linking ambiguous duplicates).

---

## Safest fix (targeted, minimal)

### Strategy

- Fix the **email handle derivation** so `inbox_conversations.primary_handle` is a canonical bare email.
- Ensure **all email conversation creation paths** attempt auto-linking (idempotent, only when `person_id` is null).
- Keep WhatsApp/SMS behavior unchanged (phone matching stays strict `.eq`), but it’s acceptable to reuse shared helpers as long as email-specific logic is guarded by `channel === 'email'`.

### Preferred fix location

- Backend (Edge Functions) is the correct place to ensure persistence:
  - Frontend can’t safely backfill without service role permissions and risks inconsistency.

---

## Exact change list (file-by-file)

### 1) Normalize + parse email addresses robustly (shared helper)

- **Add** `supabase/functions/_shared/email.ts` (or similar) with:
  - `extractEmailAddresses(headerValue: string): string[]`
    - handles RFC5322-ish `Name <email>` and comma-separated lists
    - strips whitespace
  - `normalizeEmail(value: string): string` = `lower(trim(value))`
  - `pickCounterpartyEmail({ direction, from, toList, userEmail }): string | null`

### 2) Fix Gmail sync to use canonical counterparty email

- **Edit** `supabase/functions/inbox-gmail-sync/index.ts`
  - Replace single `extractEmail()` with `extractEmailAddresses()` for both `From` and `To`
  - Derive:
    - `fromEmail = first(fromList)`
    - `toEmails = list(toHeader)`
    - `primaryHandleEmail = pickCounterpartyEmail(...)`
  - Store `primary_handle` as `primaryHandleEmail` (or leave unchanged if null but log)
  - Ensure `attemptAutoLink(..., primaryHandleEmail)` is called with the canonical value

### 3) Add auto-link to outbound new thread creation

- **Edit** `supabase/functions/inbox-gmail-new-thread/index.ts`
  - After creating the conversation:
    - call the same `attemptAutoLink` logic for email, using `trimmedTo` **after parsing/normalizing** to a single email
  - If `trimmedTo` contains multiple recipients, pick the first non-user email as above.

### 4) Optionally unify / de-duplicate attemptAutoLink implementations

- **Refactor** (small, safe):
  - Move `attemptAutoLink` + `updateLinkState` into `supabase/functions/_shared/autoLink.ts`
  - Ensure behavior remains:
    - email: normalized, case-insensitive exact match
    - sms/whatsapp: strict match
  - Update:
    - `supabase/functions/inbox-gmail-sync/index.ts`
    - `supabase/functions/twilio-sms-webhook/index.ts`
  - This is optional but reduces risk of future divergence. If time-constrained, apply only to email path in Gmail sync + new-thread.

### 5) Data repair / backfill (only if needed)

If investigation confirms many existing conversations have non-canonical `primary_handle` values:
- **Add** a new migration that:
  - backfills `person_id` by matching on **message headers** if available (preferred), or
  - continues to use `primary_handle` but only after normalizing/parsing (DB-only parsing is limited)

Recommended minimal approach:
- Keep existing migration `20260304130000_inbox_customers_email_link_backfill.sql` as-is.
- Add a targeted “repair” migration that:
  - links where `primary_handle` contains `<...>` by extracting inside angle brackets (SQL regex)
  - links where `primary_handle` contains commas by taking the first email-like token

Only do this if the data actually needs it; otherwise skip and rely on improved ingestion going forward.

---

## Regression risks / mitigations

- **Risk**: picking wrong counterparty for group emails / multi-recipient threads.
  - Mitigation: only auto-link when the derived email is unambiguous and not the user’s own email; otherwise leave `person_id` null (status remains “Not linked”).
- **Risk**: ambiguous customer matches (duplicate emails).
  - Mitigation: keep existing “exactly 1 match” requirement; otherwise set `link_state='ambiguous'`.
- **Risk**: inadvertently changing WhatsApp/SMS linking.
  - Mitigation: gate email parsing/normalization behind `channel === 'email'` and keep strict `.eq` for phones.

---

## Validation checklist (before implementing)

- **Data correctness**
  - Existing email conversation where `customers.email` matches the external party becomes linked (`person_id` populated, `link_state='linked'`).
  - Outbound “new thread” email created via UI / Edge Function links immediately when recipient matches.
  - Inbound and outbound messages both link appropriately (correct external party).
  - Duplicated customer emails produce `link_state='ambiguous'` and do not set `person_id`.

- **UI correctness**
  - Selecting a linked conversation shows person header and orders/invoices context as before.
  - Unlinked conversations still render and can be manually linked (no regressions).

- **No regressions**
  - WhatsApp/SMS conversations still link by phone exactly as before.
  - Conversation list filtering by “Unlinked” still works.
  - No runtime/type errors in Edge Functions or frontend inbox pages.

